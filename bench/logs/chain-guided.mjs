// One-off (2026-10-07, overnight): the MCP Guided test for the "win for the little guy" follow-up (not the real benchmark).
// Final setup (prompt v3, slim kit with the patched editor MCP server): Haiku 4.5 ×2, Haiku 5.5 ×2, Sonnet 5.5 and Opus 5.5
// once each (before Gemma, whose end time is unknown), then Gemma 4 26B A4B (local) up to 10 times, until one run
// builds, serves / and has both posts — or until 08:00. Each Gemma attempt is capped at 120 minutes. Then honesty + score.
// Log guided-console.log, done marker guided-done.txt.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const RESULTS = "C:/code/benchmark/results";
const LOG = `${L}/guided-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const gemmaRuns = () => fs.existsSync(RESULTS) ? fs.readdirSync(RESULTS).filter(d => /gemma/i.test(d) && fs.existsSync(path.join(RESULTS, d, "metrics.json"))).sort() : [];
const verdict = id => {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(RESULTS, id, "check.json"), "utf8"));
    const ok = k => c.checks.find(x => x.id === k)?.ok === true;
    return { win: ok("build.ok") && ok("site.frontPage200") && ok("content.twoBlogPosts"), passed: c.summary.passed, failed: c.summary.failed };
  } catch { return { win: false, passed: null, failed: null }; }
};
// no new Gemma attempt after 08:00 local the next morning
const deadline = new Date(); deadline.setDate(deadline.getDate() + 1); deadline.setHours(8, 0, 0, 0);

say(`#### MCP Guided: Haiku 4.5 ×2, Haiku 5.5 ×2, Sonnet 5.5, Opus 5.5 (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--test", "mcp-guided", "--model", "claude-haiku-4-5-20251001,claude-haiku-4-5-20251001,claude-haiku-5-5,claude-haiku-5-5,claude-sonnet-5-5,claude-opus-5-5"])}`);

for (let i = 1; i <= 10; i++) {
  if (new Date() > deadline) { say(`#### Gemma: past the 08:00 deadline, no attempt ${i}`); break; }
  const before = new Set(gemmaRuns());
  say(`#### MCP Guided: Gemma 4 26B A4B attempt ${i}/10 (${new Date().toISOString()})`);
  say(`auto exit=${step("auto.mjs", ["--test", "mcp-guided", "--model", "gemma-4-26b-a4b", "--timeout", "120"])}`);
  const id = gemmaRuns().find(d => !before.has(d));
  const v = id ? verdict(id) : null;
  say(`#### Gemma attempt ${i}: ${id ?? "no run collected"} — ${v ? `${v.win ? "BUILT IT" : "not yet"} (${v.passed} passed, ${v.failed} failed)` : "no check"}`);
  if (v?.win) break;
}

say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-guided ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/guided-done.txt`, new Date().toISOString());
