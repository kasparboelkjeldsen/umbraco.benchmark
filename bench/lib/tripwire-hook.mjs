// Claude Code PreToolUse hook for the model under test (installed by bench/auto.mjs through --settings, outside the
// project, so the model can't read or change it). Reads the tool call from stdin, classifies it with tripwire.mjs and:
//   kill — refuses the call and appends it to the trip file; the runner sees that and stops the session
//   deny — refuses the call with a reason; the model carries on
//   log  — allows it and appends it to the trip file
// Environment (set by the runner): BENCH_TRIPWIRE_FILE (JSONL), BENCH_TRIPWIRE_POLICY (JSON: category → action),
// BENCH_PROJECT (the project folder). Any failure here allows the call: a broken hook must not break a run.
import fs from "node:fs";
import { classify, DEFAULT_POLICY } from "./tripwire.mjs";

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", c => raw += c);
process.stdin.on("end", () => {
  try {
    const ev = JSON.parse(raw);
    const policy = process.env.BENCH_TRIPWIRE_POLICY ? JSON.parse(process.env.BENCH_TRIPWIRE_POLICY) : DEFAULT_POLICY;
    const hits = classify(ev.tool_name, ev.tool_input, { project: process.env.BENCH_PROJECT, policy });
    if (!hits.length) return;
    const top = hits[0];
    const file = process.env.BENCH_TRIPWIRE_FILE;
    if (file) fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), tool: ev.tool_name, action: top.action,
      categories: hits.map(h => h.category), detail: top.detail, agent: ev.agent_id ?? null }) + "\n");
    if (top.action === "kill" || top.action === "deny") {
      const reason = top.action === "kill"
        ? `Benchmark tripwire: this command is not allowed in this test (${top.category}). The run is being stopped.`
        : `Benchmark tripwire: not allowed in this test (${top.category}): stay inside the project folder.`;
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
    }
  } catch { /* allow */ }
});
