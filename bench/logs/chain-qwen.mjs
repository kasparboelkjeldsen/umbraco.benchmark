// One-off (2026-10-06): the first local-model run — Qwen 3.8 27B in LM Studio, through Claude Code, graded by Opus.
// auto (graded) → honesty → score. Log qwen-console.log, done marker qwen-done.txt.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/qwen-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
say(`#### Qwen 3.8 27B, local (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--model", "qwen3.8-27b"])}`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-qwen ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/qwen-done.txt`, new Date().toISOString());
