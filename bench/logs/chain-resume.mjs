// One-off (2026-10-03 morning): the machine went down during Fable's grading. Resume: the runner grades the leftover
// Fable run first (settleProject), then the rest of the queue; when it ends, overnight-done.txt lets the Haiku extras start.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const models = "gpt-6-astra,claude-haiku-4-5-20251001,gpt-5.6-luna,claude-sonnet-5,gpt-5.6-sol,claude-sonnet-5-5,claude-opus-5-5";
const fd = fs.openSync(`${L}/auto-overnight3-console.log`, "a");
const r = spawnSync(process.execPath, ["C:/code/benchmark/bench/auto.mjs", "--model", models, "--effort", "high", "--test", "mcp"],
  { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
fs.writeSync(fd, `exit=${r.status}\n`);
fs.closeSync(fd);
fs.writeFileSync(`${L}/overnight-done.txt`, new Date().toISOString());
