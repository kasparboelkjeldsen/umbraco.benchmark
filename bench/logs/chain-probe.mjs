// One-off (2026-10-07 night): one model on MCP Guided, to test a change. node chain-probe.mjs <model> [label]
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const [model, label = model] = process.argv.slice(2);
const L = "C:/code/benchmark/bench/logs", B = "C:/code/benchmark/bench";
const LOG = `${L}/probe-console.log`;
const say = s => fs.appendFileSync(LOG, s + "\n");
const fd = fs.openSync(LOG, "a");
say(`#### Probe ${label}: ${model} on MCP Guided (${new Date().toISOString()})`);
const r = spawnSync(process.execPath, [`${B}/auto.mjs`, "--test", "mcp-guided", "--model", model], { stdio: ["ignore", fd, fd], cwd: "C:/code/benchmark" });
say(`auto exit=${r.status}\nexit=done-probe ${new Date().toISOString()}`);
