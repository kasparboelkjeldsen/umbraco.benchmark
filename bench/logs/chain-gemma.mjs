// One-off (2026-10-06): local-model run — Gemma 4 26B A4B (QAT) in LM Studio (Qwen 3.8 27B was too slow), through Claude Code, graded by Opus.
// auto (graded) → honesty → score. Log gemma-console.log, done marker gemma-done.txt.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/gemma-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
say(`#### Gemma 4 26B A4B (QAT), local (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--model", "gemma-4-26b-a4b"])}`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-gemma ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/gemma-done.txt`, new Date().toISOString());
