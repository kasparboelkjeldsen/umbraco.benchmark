// One-off (2026-10-02 ~22:00): the running sweep has the Claude Bash `cd` handicap (fnm hook without fnm's env), fixed in
// lib/claude.mjs after it started. At the first run boundary after Opus, stop it, clean up, and relaunch the rest of the
// queue with the fixed code — plus reruns of the two Claude runs that had the handicap (Sonnet 5.5, Opus 5.5).
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs";
const B = "C:/code/benchmark/bench";
const LOG = `${L}/auto-overnight-console.log`;
const SWEEP_PARENT = Number(process.argv[2]); // chain-overnight.mjs pid
const note = s => fs.appendFileSync(`${L}/chain-restart.log`, `${new Date().toISOString()} ${s}\n`);

note(`watching for the run after claude-opus-5-5 (sweep parent ${SWEEP_PARENT})`);
let trigger = null;
while (!trigger) {
  const text = fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8") : "";
  const headers = [...text.matchAll(/^════════ (\S+) · MCP ════════/gm)].map(m => m[1]);
  const opusAt = headers.findIndex(h => h.startsWith("claude-opus-5-5"));
  if (opusAt >= 0 && headers.slice(opusAt + 1).some(h => !h.startsWith("claude-opus-5-5"))) trigger = headers.at(-1);
  if (/^exit=/m.test(text)) { note("sweep ended before the boundary; nothing to do"); process.exit(0); }
  if (!trigger) await new Promise(r => setTimeout(r, 1000));
}
note(`boundary reached (${trigger} starting): stopping the sweep`);
spawnSync("taskkill", ["/PID", String(SWEEP_PARENT), "/T", "/F"], { encoding: "utf8" });
await new Promise(r => setTimeout(r, 3000));
const node = (s, a = []) => spawnSync(process.execPath, [`${B}/${s}`, ...a], { encoding: "utf8", cwd: "C:/code/benchmark" });
note(`down: ${node("down.mjs").stdout.trim()}`);
note(`reset: ${node("reset.mjs", ["--force", "--as", `restart-${Date.now()}`]).stdout.trim().split("\n").at(-1)}`);
note(`status: ${node("status.mjs").stdout.split("\n").slice(1, 2).join(" ")}`);
fs.appendFileSync(LOG, `\n[restarted with the fnm cd fix at ${new Date().toISOString()}; continuing in auto-overnight2-console.log]\nexit=restarted\n`);

const models = "gpt-6-sol,claude-fable-5-1,gpt-6-astra,claude-haiku-4-5-20251001,gpt-5.6-luna,claude-sonnet-5,gpt-5.6-sol,claude-sonnet-5-5,claude-opus-5-5";
const fd = fs.openSync(`${L}/auto-overnight2-console.log`, "a");
note(`relaunching: ${models}`);
const r = spawnSync(process.execPath, [`${B}/auto.mjs`, "--model", models, "--effort", "high", "--test", "mcp"], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
fs.writeSync(fd, `exit=${r.status}\n`);
fs.closeSync(fd);
fs.writeFileSync(`${L}/overnight-done.txt`, new Date().toISOString());
note(`sweep finished, exit ${r.status}`);
