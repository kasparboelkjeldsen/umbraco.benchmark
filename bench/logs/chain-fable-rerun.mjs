// One-off (2026-10-03): after sweep 2, rerun Fable 5.1. Its sweep-2 run (2026-10-03_1011) lost ~15 min to the Umbraco
// MCP server hanging (create-element-type: "fetch failed" after 314 s, then "Token request failed: 500" after 582 s,
// with every parallel call stuck behind it). If the rerun is graded, the stalled run is excluded from the score.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/sweep2-console.log`;
const STALLED = "C:/code/benchmark/results/2026-10-03_1011_mcp_fable-5.1-high";
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
while (!fs.existsSync(`${L}/sweep2-done.txt`)) await new Promise(r => setTimeout(r, 30_000));
say(`\n#### Fable 5.1 rerun (MCP stall in 2026-10-03_1011) (${new Date().toISOString()})`);
const s = step("auto.mjs", ["--model", "fable-5-1"]);
say(`auto exit=${s}`);
if (s === 0) {
  fs.writeFileSync(`${STALLED}/flags.json`, JSON.stringify({
    excludeFromScore: true,
    reason: "the Umbraco MCP server hung for ~15 min mid-run (fetch failed after 314 s, token request 500 after 582 s); rerun on 2026-10-03",
  }, null, 2) + "\n");
  say("flagged 2026-10-03_1011 excludeFromScore");
}
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-fable-rerun ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/fable-rerun-done.txt`, new Date().toISOString());
