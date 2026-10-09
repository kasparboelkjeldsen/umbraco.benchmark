// One-off (2026-10-08 night): takes over chain-guided.mjs's Gemma loop after attempt 1 (MCP Guided, which got nowhere
// in 80 minutes). Waits for that attempt's auto.mjs to finish, then Gemma attempts 2–10 on MCP Guided+ (the cheat-sheet
// prompt), until one run builds, serves / and has both posts, or 08:00. Then honesty + score. Same log as chain-guided.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench", RESULTS = "C:/code/benchmark/results";
const LOG = `${L}/guided-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const autoRunning = () => /auto\.mjs/.test(spawnSync("powershell", ["-NoProfile", "-Command",
  "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'bench[\\/]auto\.mjs' } | ForEach-Object { $_.CommandLine }"], { encoding: "utf8" }).stdout || "");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const gemmaRuns = () => fs.existsSync(RESULTS) ? fs.readdirSync(RESULTS).filter(d => /gemma/i.test(d) && fs.existsSync(path.join(RESULTS, d, "metrics.json"))).sort() : [];
const verdict = id => {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(RESULTS, id, "check.json"), "utf8"));
    const ok = k => c.checks.find(x => x.id === k)?.ok === true;
    return { win: ok("build.ok") && ok("site.frontPage200") && ok("content.twoBlogPosts"), passed: c.summary.passed, failed: c.summary.failed };
  } catch { return { win: false, passed: null, failed: null }; }
};
const deadline = new Date(); if (deadline.getHours() >= 12) deadline.setDate(deadline.getDate() + 1); deadline.setHours(8, 0, 0, 0);

while (autoRunning()) await sleep(30_000);
const v1 = null;
say("#### Gemma attempt 1 (MCP Guided): stopped at 1:23 with no Block Grid data type, set aside in results-extra/ (ungraded)");

for (let i = 2; i <= 10 && !v1?.win; i++) {
  if (new Date() > deadline) { say(`#### Gemma: past the 08:00 deadline, no attempt ${i}`); break; }
  const before = new Set(gemmaRuns());
  say(`#### MCP Guided+: Gemma 4 26B A4B attempt ${i}/10 (${new Date().toISOString()})`);
  say(`auto exit=${step("auto.mjs", ["--test", "mcp-guided-plus", "--model", "gemma-4-26b-a4b", "--timeout", "120"])}`);
  const id = gemmaRuns().find(d => !before.has(d));
  const v = id ? verdict(id) : null;
  say(`#### Gemma attempt ${i}: ${id ?? "no run collected"} — ${v ? `${v.win ? "BUILT IT" : "not yet"} (${v.passed} passed, ${v.failed} failed)` : "no check"}`);
  if (v?.win) break;
}

say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-guided ${new Date().toISOString()}`);
fs.writeFileSync(`${L}/guided-done.txt`, new Date().toISOString());
