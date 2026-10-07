// One-off (2026-10-02): after the overnight sweep, 4 extra ungraded Haiku 4.5 runs for anecdotes.
// Kept apart in results-extra/ (BENCH_RESULTS) so they don't replace the graded Haiku run in the report.
// Each: run (--no-grade) → check (boot, snapshot, crawl) → screenshots → reset (archived under its run id).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/auto-haiku-extra-console.log`;
const env = { ...process.env, BENCH_RESULTS: "C:/code/benchmark/results-extra" };
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark", env });
  fs.closeSync(fd);
  return r.status;
};
while (!fs.existsSync(`${L}/overnight-done.txt`)) await new Promise(r => setTimeout(r, 30_000));
for (let i = 1; i <= 4; i++) {
  say(`\n#### Haiku extra run ${i}/4 (${new Date().toISOString()})`);
  const s = step("auto.mjs", ["--model", "claude-haiku-4-5-20251001", "--no-grade", "--test", "mcp"]);
  say(`run exit=${s}`);
  const runs = fs.existsSync(env.BENCH_RESULTS) ? fs.readdirSync(env.BENCH_RESULTS).filter(d => /haiku/.test(d)).sort() : [];
  const id = runs.at(-1);
  if (s === 0 && id) { say(`check exit=${step("check.mjs", ["--run", id])}`); say(`screenshot exit=${step("screenshot.mjs", ["--run", id])}`); }
  say(`reset exit=${step("reset.mjs", ["--force", ...(id ? ["--run", id] : [])])}`);
}
say(`\nexit=done ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/haiku-extra-done.txt`, new Date().toISOString());
