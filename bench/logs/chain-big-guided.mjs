// One-off (2026-10-08): Sonnet 5.5 and Opus 5.5 twice more each on MCP Guided (3 each in all), to see whether the
// guidance changes their time, cost or grade vs the real benchmark (2 runs each). Waits for chain-gemma-plus to finish.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench";
const LOG = `${L}/guided-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
while (!fs.existsSync(`${L}/guided-done.txt`)) await sleep(30_000);
say(`#### MCP Guided: Sonnet 5.5 ×2, Opus 5.5 ×2 more (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--test", "mcp-guided", "--model", "claude-sonnet-5-5,claude-opus-5-5,claude-sonnet-5-5,claude-opus-5-5"])}`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-big-guided ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/big-guided-done.txt`, new Date().toISOString());
