// One-off chain (2026-10-02): after the Terra run ends, grade it, then run Sonnet 5.5 (graded).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const auto = "C:/code/benchmark/bench/auto.mjs";
const run = (args, log) => {
  const fd = fs.openSync(`${L}/${log}`, "a");
  const r = spawnSync(process.execPath, [auto, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.writeSync(fd, `exit=${r.status}\n`);
  fs.closeSync(fd);
  return r.status;
};
while (!/^exit=/m.test(fs.existsSync(`${L}/auto-terra-console.log`) ? fs.readFileSync(`${L}/auto-terra-console.log`, "utf8") : "")) await new Promise(r => setTimeout(r, 10_000));
run(["--grade-only"], "auto-terra-grade-console.log");
run(["--model", "claude-sonnet-5-5", "--effort", "high"], "auto-sonnet-console.log");
fs.writeFileSync(`${L}/chain-done.txt`, new Date().toISOString());
