// One-off (2026-10-03): sweep 2 restarted at a run boundary with the Codex MCP-startup fix (bench/lib/codex.mjs
// waitForMcp). GPT-6-Sol's run 2026-10-03_1107 started prompt 1 before the Umbraco MCP server was ready, never saw its
// tools, and drove the server over a stdio script instead. When "════════ gpt-5.6-terra" shows up in the log, this stops
// the old sweep (chain pid 2108 and its auto.mjs tree, still on the old code), reruns GPT-6-Sol, runs the remaining
// Codex models, flags 1107 if the rerun is graded, and then writes sweep2-done.txt (which starts the Fable rerun,
// honesty and score in chain-fable-rerun.mjs).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/sweep2-console.log`;
const OLD_CHAIN = 2108;
const SOL = "C:/code/benchmark/results/2026-10-03_1107_mcp_gpt-6-sol-high";
const say = s => fs.appendFileSync(LOG, s + "\n");
const ps = cmd => spawnSync("powershell.exe", ["-NoProfile", "-Command", cmd], { encoding: "utf8" }).stdout.trim();
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};

// wait for the boundary (or for the old sweep to end on its own)
// (Astra hit the Codex limit at 11:32 and was requeued; the old sweep then sat idle waiting for the reset — also a boundary)
while (!/════════ gpt-5\.6-terra|⏳ Waiting for usage limits/.test(fs.readFileSync(LOG, "utf8")) && !fs.existsSync(`${L}/sweep2-done.txt`))
  await new Promise(r => setTimeout(r, 5_000));
if (fs.existsSync(`${L}/sweep2-done.txt`)) { say("chain-sweep2b: old sweep already finished; nothing to do"); process.exit(0); }

const autoPid = ps(`(Get-CimInstance Win32_Process -Filter "ParentProcessId=${OLD_CHAIN}" | Where-Object { $_.CommandLine -match 'auto\\.mjs' }).ProcessId`);
ps(`Stop-Process -Id ${OLD_CHAIN} -Force -ErrorAction SilentlyContinue`);
if (autoPid) spawnSync("taskkill", ["/T", "/F", "/PID", autoPid]);
say(`\n#### Stopped the old sweep at a run boundary (chain ${OLD_CHAIN}, auto ${autoPid || "?"}); restarting with the MCP-startup fix (${new Date().toISOString()})`);
await new Promise(r => setTimeout(r, 5_000));
// whatever the old run left behind (Umbraco, a half-set-up project) is cleaned up by the reset below
say(`reset exit=${step("reset.mjs", ["--force"])}`);

const s = step("auto.mjs", ["--model", "gpt-6-sol,gpt-6-astra,gpt-5.6-terra,gpt-5.6-luna,gpt-5.6-sol"]);
say(`auto exit=${s}`);
const sol = fs.readdirSync("C:/code/benchmark/results").filter(d => /gpt-6-sol/.test(d) && d > "2026-10-03_1107");
if (sol.some(d => fs.existsSync(`C:/code/benchmark/results/${d}/grade.json`))) {
  fs.writeFileSync(`${SOL}/flags.json`, JSON.stringify({
    excludeFromScore: true,
    reason: "the runner started prompt 1 before the Umbraco MCP server was ready, so the model never saw its tools (fixed 2026-10-03: waitForMcp); rerun on 2026-10-03",
  }, null, 2) + "\n");
  say("flagged 2026-10-03_1107 excludeFromScore");
}
say(`\nexit=done-sweep2b ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/sweep2-done.txt`, new Date().toISOString());
