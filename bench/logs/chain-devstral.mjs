// One-off (2026-10-10): Devstral 2 (Mistral's agentic coding model) ×2 on MCP and ×2 on MCP Recipe, one run per
// auto call. Before each run, checks the OpenRouter balance and stops below $4. Then honesty + score.
// Log: devstral-console.log
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench";
const LOG = `${L}/devstral-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
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
const M = "mistralai/devstral-2512";
say(`#### Devstral 2: MCP ×2, MCP Recipe ×2 (${new Date().toISOString()})`);
for (const test of ["mcp", "mcp-recipe", "mcp", "mcp-recipe"]) {
  const left = await balance();
  say(`#### OpenRouter balance before ${test}: ${left == null ? "unknown" : "$" + left.toFixed(2)}`);
  if (left != null && left < 4) { say("#### Below $4: stopping"); break; }
  say(`auto exit=${step("auto.mjs", ["--test", test, "--model", M])}`);
}
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`#### OpenRouter balance at the end: $${(await balance())?.toFixed(2)}`);
say(`\nexit=done-devstral ${new Date().toISOString()}`);
