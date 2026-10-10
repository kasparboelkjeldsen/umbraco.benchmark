// One-off (2026-10-10): GLM 5.3 Flash ×3 on MCP Skills control (same prompt, kit and guardrails, no skills),
// then honesty + score. Log: skills-control-console.log
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench";
const LOG = `${L}/skills-control-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
say(`#### MCP Skills control: GLM 5.3 Flash ×3 (${new Date().toISOString()})`);
const g = "z-ai/glm-5.3-flash";
say(`auto exit=${step("auto.mjs", ["--test", "mcp-skills-control", "--model", [g, g, g].join(",")])}`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-skills-control ${new Date().toISOString()}`);
