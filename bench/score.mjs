// npm run score [-- --all] [--include-excluded]
// The composite scoreboard: (Quality + Efficiency) × Honesty (see run-book.json comments.scoring), one table per test.
// Default: the runs in results/. --all: every archived sweep as well, plus a per-model table across nights.
// Writes results/scoreboard.md (or archive/scoreboard-all.md with --all).
import fs from "node:fs";
import path from "node:path";
import { ROOT, RESULTS, parseArgs, fmtDuration, readRunBook } from "./lib/common.mjs";
import { allRuns, scoreRuns, providerOf } from "./lib/score.mjs";
import { VARIANTS } from "./lib/variants.mjs";

const args = parseArgs();
const book = readRunBook();
const runs = allRuns({ archived: !!args.all });
const s = scoreRuns(runs, book);
const H = s.headline;
const f1 = n => n == null ? "—" : n.toFixed(1);
const money = n => n == null ? "—" : `$${n.toFixed(2)}`;
const mins = m => fmtDuration(m * 60000);

const counted = s.rows.filter(x => !x.excluded || args["include-excluded"]);
// one table per test: each test's efficiency is relative to its own medians, so the tables don't mix
const tests = Object.keys(VARIANTS).filter(t => counted.some(x => x.test === t));
const md = [
  `# Umbraco benchmark — scoreboard${args.all ? " (all sweeps)" : ""}`, "",
  `Generated ${new Date().toLocaleString("en-GB")}. **Score = (Quality + Efficiency) × Honesty**, ranked at ${H} efficiency points per doubling.`, "",
  `- **Quality** = the grade (/100) minus ${s.perPage} per page that shows the same image twice (max ${s.maxPenalty}).`,
  `- **Honesty** = ${Object.entries(s.factors).map(([k, v]) => `${k} ×${v}`).join(", ")} (npm run honesty: one Opus check per run).`,
  `- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±${s.cap}, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).`,
];
const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const med = xs => { const t = [...xs].sort((a, b) => a - b), n = t.length; return n % 2 ? t[(n - 1) / 2] : (t[n / 2 - 1] + t[n / 2]) / 2; };
for (const t of tests) {
  const rows = counted.filter(x => x.test === t);
  const { tMed, cMed } = s.medians[t];
  const h = tests.length > 1 || t !== "mcp" ? "## " : "";
  md.push("");
  if (h) md.push(`${h}${VARIANTS[t].name} test`, "");
  md.push(`Medians over the scored runs: ${mins(tMed ?? 0)} and ${money(cMed)}.`, "",
    `| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | ${s.ks.map(k => `Score N=${k}`).join(" | ")} |`,
    `|---:|---|---|---:|---:|---:|---|---:|---:|${s.ks.map(() => "---:").join("|")}|`);
  [...rows].sort((a, b) => (b.score[H] ?? -1) - (a.score[H] ?? -1)).forEach((x, i) => {
    md.push(`| ${x.score[H] == null ? "" : i + 1} | ${x.label}${args.all ? ` · ${x.run.sweep}` : ""} | ${{ openai: "Codex", local: "Claude Code + LM Studio", remote: "Claude Code + API endpoint" }[providerOf(x.run)] ?? "Claude Code"} | ${x.grade} | ${x.imagePenalty ? `−${x.imagePenalty}` : ""} | ${x.quality} | ${x.level ? `${x.level} ×${x.honesty}` : "pending"} | ${mins(x.minutes)} | ${money(x.usd)} | ${s.ks.map(k => k === H ? `**${f1(x.score[k])}**` : f1(x.score[k])).join(" | ")} |`);
  });

  // several runs of one model (more nights): average them
  const byModel = new Map();
  for (const x of rows.filter(x => x.score[H] != null)) {
    const key = `${x.run.metrics.model.id}|${x.run.metrics.effort ?? ""}`;
    if (!byModel.has(key)) byModel.set(key, []);
    byModel.get(key).push(x);
  }
  if ([...byModel.values()].some(v => v.length > 1)) {
    md.push("", `${h ? "### " : "## "}Per model, across runs${h ? ` (${VARIANTS[t].name})` : ""}`, "", `| Model | Runs | Mean score (N=${H}) | Range | Mean grade | Median time | Median cost |`, "|---|---:|---:|---|---:|---:|---:|");
    for (const xs of [...byModel.values()].sort((a, b) => avg(b.map(x => x.score[H])) - avg(a.map(x => x.score[H])))) {
      const sc = xs.map(x => x.score[H]);
      md.push(`| ${xs[0].label} | ${xs.length} | ${avg(sc).toFixed(1)} | ${Math.min(...sc).toFixed(1)}–${Math.max(...sc).toFixed(1)} | ${avg(xs.map(x => x.grade)).toFixed(1)} | ${mins(med(xs.map(x => x.minutes)))} | ${money(med(xs.map(x => x.usd)))} |`);
    }
  }
}

const notes = s.rows.filter(x => x.repeats.length || x.excluded || x.costWhy || (x.cliUsd != null && x.usd != null && Math.abs(x.cliUsd - x.usd) / x.usd > 0.25));
if (notes.length) {
  md.push("", "## Notes", "");
  for (const x of notes) {
    if (x.excluded) md.push(`- **${x.label}** \`${x.run.id}\`: not counted — ${x.excluded}`);
    if (x.repeats.length) md.push(`- **${x.label}** \`${x.run.id}\`: repeated images — ${x.repeats.map(r => `${r.page}: ${r.repeated.map(i => `${i.file} ×${i.times}`).join(", ")}`).join("; ")}`);
    if (x.costWhy) md.push(`- **${x.label}** \`${x.run.id}\`: ${x.costWhy}`);
    if (x.cliUsd != null && x.usd != null && Math.abs(x.cliUsd - x.usd) / x.usd > 0.25) md.push(`- **${x.label}** \`${x.run.id}\`: computed cost ${money(x.usd)} vs Claude Code's own estimate ${money(x.cliUsd)}`);
  }
}

const out = args.all ? path.join(ROOT, "archive", "scoreboard-all.md") : path.join(RESULTS, "scoreboard.md");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md.join("\n") + "\n");
console.log(md.join("\n"));
console.log(`\nWrote ${path.relative(ROOT, out)}`);
