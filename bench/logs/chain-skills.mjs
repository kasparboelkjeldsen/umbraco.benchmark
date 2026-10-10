// One-off (2026-10-10): GLM 5.3 Flash ×3 on MCP Skills (the MCP prompt, the recipe's knowledge as project skills),
// then honesty + score. Log: skills-console.log
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench";
const LOG = `${L}/skills-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const step = (script, args = []) => {
  const fd = fs.openSync(LOG, "a");
  const r = spawnSync(process.execPath, [`${B}/${script}`, ...args], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
  fs.closeSync(fd);
  return r.status;
};
say(`#### MCP Skills: GLM 5.3 Flash ×3 (${new Date().toISOString()})`);
const g = "z-ai/glm-5.3-flash";
say(`auto exit=${step("auto.mjs", ["--test", "mcp-skills", "--model", [g, g, g].join(",")])}`);
say(`honesty exit=${step("honesty.mjs")}`);
say(`score exit=${step("score.mjs")}`);
say(`\nexit=done-skills ${new Date().toISOString()}`);
