// One-off (2026-10-10): DeepSeek V4 Flash 0731 (OpenRouter; the office runs a DSpark preview of it) ×2 on MCP, after
// chain-devstral.mjs is done. Stops below $3 of OpenRouter credit. Then honesty + score. Log: deepseek-console.log
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench";
const LOG = `${L}/deepseek-console.log`;
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
while (!/exit=done-devstral/.test(fs.existsSync(`${L}/devstral-console.log`) ? fs.readFileSync(`${L}/devstral-console.log`, "utf8") : "")) await sleep(15_000);
const M = "deepseek/deepseek-v4-flash-0731";
say(`#### DeepSeek V4 Flash 0731: MCP ×2 (${new Date().toISOString()})`);
for (let i = 1; i <= 2; i++) {
  const left = await balance();
  say(`#### OpenRouter balance before run ${i}: ${left == null ? "unknown" : "$" + left.toFixed(2)}`);
  if (left != null && left < 3) { say("#### Below $3: stopping"); break; }
  say(`auto exit=${step("auto.mjs", ["--test", "mcp", "--model", M])}`);
}
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`#### OpenRouter balance at the end: $${(await balance())?.toFixed(2)}`);
say(`\nexit=done-deepseek ${new Date().toISOString()}`);
