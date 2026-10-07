// One-off (2026-10-03): after Haiku extra 5, up to 5 more Haiku runs (6–10), ungraded, until one serves a working
// front page (check.json site.frontPage200). Each: run → check → screenshots → reset (archived under its run id).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/auto-haiku-extra-console.log`;
const R = "C:/code/benchmark/results-extra";
const env = { ...process.env, BENCH_RESULTS: R };
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark", env });
  fs.closeSync(fd);
  return r.status;
};
while (!fs.existsSync(`${L}/haiku-extra5-done.txt`)) await new Promise(r => setTimeout(r, 30_000));
for (let i = 6; i <= 10; i++) {
  say(`\n#### Haiku extra run ${i}/10 (until one works) (${new Date().toISOString()})`);
  const before = new Set(fs.existsSync(R) ? fs.readdirSync(R) : []);
  const s = step("auto.mjs", ["--model", "claude-haiku-4-5-20251001", "--no-grade", "--test", "mcp"]);
  say(`run exit=${s}`);
  const id = fs.readdirSync(R).filter(d => !before.has(d) && /haiku/.test(d)).sort().at(-1);
  let works = false;
  if (s === 0 && id) {
    say(`check exit=${step("check.mjs", ["--run", id])}`);
    say(`screenshot exit=${step("screenshot.mjs", ["--run", id])}`);
    const c = JSON.parse(fs.readFileSync(`${R}/${id}/check.json`, "utf8"));
    works = c.checks.find(x => x.id === "site.frontPage200")?.ok === true;
    say(`front page works: ${works} (${c.checks.find(x => x.id === "site.frontPage200")?.detail}); all pages: ${c.checks.find(x => x.id === "site.allPagesRender")?.detail}`);
  }
  say(`reset exit=${step("reset.mjs", ["--force", ...(id ? ["--run", id] : [])])}`);
  if (works) { say(`HAIKU WORKS on run ${i}: ${id}`); fs.writeFileSync(`${L}/haiku-works.txt`, `${id}\n`); break; }
}
say(`\nexit=done-more ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/haiku-more-done.txt`, new Date().toISOString());
