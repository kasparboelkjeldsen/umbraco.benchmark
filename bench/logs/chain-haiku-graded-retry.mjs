// One-off (2026-10-03): the graded Haiku run failed the old prompt-1 check twice (it says "connected" without calling
// a tool; the check now also accepts a connected server, like Codex's). After the extras, do the graded run again.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
while (!fs.existsSync(`${L}/haiku-extra-done.txt`)) await new Promise(r => setTimeout(r, 30_000));
const fd = fs.openSync(`${L}/auto-haiku-graded2-console.log`, "a");
const r = spawnSync(process.execPath, ["C:/code/benchmark/bench/auto.mjs", "--model", "claude-haiku-4-5-20251001", "--test", "mcp"], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
fs.writeSync(fd, `exit=${r.status}\n`);
fs.closeSync(fd);
fs.writeFileSync(`${L}/all-done.txt`, new Date().toISOString());
