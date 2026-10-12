// One-off (2026-10-12, work machine): more Devstral 2 runs on MCP Recipe, through OpenRouter, to compare with the office
// DeepSeek DSpark on the same test. Same settings as chain-devstral.mjs at home (run-book openrouter section, one run per
// auto call, graded by Opus), so these runs add to the 2026-10-10 pair. Before each run, checks the OpenRouter balance
// and stops below FLOOR. Then honesty + score. Log: devstral-recipe-work-console.log
//   node bench/logs/chain-devstral-recipe-work.mjs [runs] [floor]    (OPENROUTER_API_KEY in the environment)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const B = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), ROOT = path.dirname(B), L = path.join(B, "logs");
const RUNS = Number(process.argv[2] || 6), FLOOR = Number(process.argv[3] || 1);
const LOG = path.join(L, "devstral-recipe-work-console.log");
const say = s => { fs.appendFileSync(LOG, s + "\n"); console.log(s); };
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [path.join(B, script), ...args], { stdio: ["ignore", fd, fd], cwd: ROOT });
  fs.closeSync(fd);
  return r.status;
};
const balance = async () => {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/credits", { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } });
    const d = (await r.json()).data;
    return d.total_credits - d.total_usage;
  } catch { return null; }
};
if (!process.env.OPENROUTER_API_KEY) { console.error("OPENROUTER_API_KEY isn't set."); process.exit(1); }
const M = "mistralai/devstral-2512";
say(`#### Devstral 2: MCP Recipe ×${RUNS}, stop below $${FLOOR} (${new Date().toISOString()})`);
for (let i = 1; i <= RUNS; i++) {
  const left = await balance();
  say(`#### OpenRouter balance before run ${i}: ${left == null ? "unknown" : "$" + left.toFixed(2)}`);
  if (left != null && left < FLOOR) { say(`#### Below $${FLOOR}: stopping`); break; }
  say(`auto exit=${step("auto.mjs", ["--test", "mcp-recipe", "--model", M])}`);
}
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`#### OpenRouter balance at the end: $${(await balance())?.toFixed(2)}`);
say(`\nexit=done-devstral-recipe-work ${new Date().toISOString()}`);
