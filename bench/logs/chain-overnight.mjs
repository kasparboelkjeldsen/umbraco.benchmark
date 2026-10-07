// One-off (2026-10-02): once the Terra/Sonnet chain is done, run the overnight MCP sweep.
// Codex models in the user's priority order, interleaved with Claude models so Claude runs fill any Codex limit waits.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
while (!fs.existsSync(`${L}/chain-done.txt`)) await new Promise(r => setTimeout(r, 15_000));
const models = "gpt-6-luna,claude-opus-5-5,gpt-6-sol,claude-fable-5-1,gpt-6-astra,claude-haiku-4-5-20251001,gpt-5.6-luna,claude-sonnet-5,gpt-5.6-sol";
const fd = fs.openSync(`${L}/auto-overnight-console.log`, "a");
const r = spawnSync(process.execPath, ["C:/code/benchmark/bench/auto.mjs", "--model", models, "--effort", "high", "--test", "mcp"],
  { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
fs.writeSync(fd, `exit=${r.status}\n`);
fs.closeSync(fd);
fs.writeFileSync(`${L}/overnight-done.txt`, new Date().toISOString());
