// One-off (2026-10-07): Haiku 5.5 is out — two graded runs (N=2, like every other model), then honesty + score.
// Log haiku55-console.log, done marker haiku55-done.txt.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/haiku55-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
say(`#### Haiku 5.5 × 2 (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--model", "claude-haiku-5-5,claude-haiku-5-5"])}`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-haiku55 ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/haiku55-done.txt`, new Date().toISOString());
