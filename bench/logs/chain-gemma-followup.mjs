// One-off (2026-10-06, user's instruction before bed): when the Gemma run (chain-gemma.mjs) is done — if it failed
// (no graded run, or the blog prompt timed out or ended in an error), run Gemma once more with the proxy's request log,
// then honesty + score. Either way, unload the model at the end.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const R = "C:/code/benchmark/results";
const LOG = `${L}/gemma-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const readJson = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const gemmaRuns = () => (fs.existsSync(R) ? fs.readdirSync(R) : []).filter(d => /gemma/.test(d) && fs.existsSync(path.join(R, d, "metrics.json"))).sort();

const before = new Set(gemmaRuns());
while (!fs.existsSync(`${L}/gemma-done.txt`)) await new Promise(r => setTimeout(r, 30_000));

const id = gemmaRuns().at(-1);
const auto = id ? readJson(path.join(R, id, "auto.json")) : null;
const graded = id ? !!readJson(path.join(R, id, "grade.json")) : false;
const failed = !id || !graded || auto?.prompt2?.timedOut || auto?.prompt2?.isError;
say(`\n#### Follow-up: run ${id ?? "(none)"} — ${failed ? `FAILED (${!id ? "no run" : !graded ? "not graded" : auto?.prompt2?.timedOut ? "blog prompt timed out" : "blog prompt ended in an error"}): one more run with the proxy request log` : "graded; no second run"} (${new Date().toISOString()})`);
if (failed) {
  say(`auto exit=${step("auto.mjs", ["--model", "gemma-4-26b-a4b"])}`);
  say(`honesty exit=${step("honesty.mjs")}`);
  say(`score exit=${step("score.mjs")}`);
}
// the runner unloads at the end of its sweep; make sure, whatever happened
const lms = path.join(process.env.USERPROFILE || "", ".lmstudio", "bin", "lms.exe");
if (fs.existsSync(lms)) say(`unload: ${spawnSync(lms, ["unload", "--all"], { encoding: "utf8" }).stdout?.trim() || "done"}`);
say(`\nexit=done-followup ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/gemma-followup-done.txt`, new Date().toISOString());
