// One-off (2026-10-10): Gemma 4 26B A4B (LM Studio) on MCP Recipe v2, up to 3 attempts, stopping at the first that
// builds, serves / and has both posts. Then honesty + score. Log: gemma-recipe-console.log
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench", RESULTS = "C:/code/benchmark/results";
const LOG = `${L}/gemma-recipe-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const gemmaRuns = () => fs.existsSync(RESULTS) ? fs.readdirSync(RESULTS).filter(d => /gemma/i.test(d) && fs.existsSync(path.join(RESULTS, d, "metrics.json"))).sort() : [];
const verdict = id => {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(RESULTS, id, "check.json"), "utf8"));
    const ok = k => c.checks.find(x => x.id === k)?.ok === true;
    return { win: ok("build.ok") && ok("site.frontPage200") && ok("content.twoBlogPosts"), passed: c.summary.passed, failed: c.summary.failed };
  } catch { return { win: false, passed: null, failed: null }; }
};
for (let i = 1; i <= 3; i++) {
  const before = new Set(gemmaRuns());
  say(`#### MCP Recipe v2: Gemma 4 26B A4B attempt ${i}/3 (${new Date().toISOString()})`);
  say(`auto exit=${step("auto.mjs", ["--test", "mcp-recipe", "--model", "gemma-4-26b-a4b", "--timeout", "120"])}`);
  const id = gemmaRuns().find(d => !before.has(d));
  const v = id ? verdict(id) : null;
  say(`#### Gemma attempt ${i}: ${id ?? "no run collected"} — ${v ? `${v.win ? "BUILT IT" : "not yet"} (${v.passed} passed, ${v.failed} failed)` : "no check"}`);
  if (v?.win) break;
}
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-gemma-recipe ${new Date().toISOString()}`);
