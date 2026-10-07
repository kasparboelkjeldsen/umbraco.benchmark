// One-off (2026-10-03): second full MCP sweep, Haiku skipped. auto (graded) → honesty → score.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/sweep2-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const MODELS = "sonnet-5-5,opus-5-5,fable-5-1,sonnet-5,gpt-6-luna,gpt-6-sol,gpt-6-astra,gpt-5.6-terra,gpt-5.6-luna,gpt-5.6-sol";
say(`#### Sweep 2 (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--model", MODELS])}`);
say(`#### Honesty (${new Date().toISOString()})`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-sweep2 ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/sweep2-done.txt`, new Date().toISOString());
