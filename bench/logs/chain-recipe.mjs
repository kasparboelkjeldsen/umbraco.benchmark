// One-off (2026-10-10): the MCP Recipe test. Haiku 5.5 first, to prove the recipe ("this route has been run end to end"
// must be true); only if it grades 90+ do Mistral Large 4 ×2 and GLM 5.3 Flash ×2 follow. Then honesty + score.
// Log recipe-console.log. Needs OPENROUTER_API_KEY in the environment.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench", RESULTS = "C:/code/benchmark/results";
const LOG = `${L}/recipe-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
const runs = () => fs.existsSync(RESULTS) ? fs.readdirSync(RESULTS).filter(d => /_mcp-recipe_/.test(d)).sort() : [];
say(`#### MCP Recipe: proving run, Haiku 5.5 (${new Date().toISOString()})`);
say(`auto exit=${step("auto.mjs", ["--test", "mcp-recipe", "--model", "claude-haiku-5-5"])}`);
const proof = runs().find(d => /haiku/.test(d));
let grade = null;
try { grade = JSON.parse(fs.readFileSync(path.join(RESULTS, proof, "grade.json"), "utf8")).total; } catch {}
say(`#### Proving run: ${proof ?? "none"} graded ${grade ?? "—"}`);
if (grade != null && grade >= 90) {
  say(`#### MCP Recipe: Mistral Large 4 ×2, GLM 5.3 Flash ×2 (${new Date().toISOString()})`);
  say(`auto exit=${step("auto.mjs", ["--test", "mcp-recipe", "--model", "mistralai/mistral-large-4-0,z-ai/glm-5.3-flash,mistralai/mistral-large-4-0,z-ai/glm-5.3-flash"])}`);
} else say("#### Recipe not proven: stopping before the open models");
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-recipe ${new Date().toISOString()}`);
