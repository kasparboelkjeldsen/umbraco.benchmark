// npm run auto                       — the sweep described in run-book.json
// npm run auto -- --model <alias|id>[:effort][,…] [--effort <level>] [--test <mcp|migrations|playwright>[,…]]
//                 [--grader opus] [--grader-effort high] [--no-grade] [--grade-only] [--permission-mode auto]
//                 [--budget <usd>] [--timeout <min>] [--claude <path>] [--quiet] [--dry-run]
// Runs the benchmark end to end without a human: sets up the test, boots Umbraco, plays the prompts from tests/<test>.md
// into one headless Claude Code session in Umbraco.Bench, collects the run, has a second headless session grade it
// with exam-prompt.md (which also resets the project), and rebuilds the report. Several models/tests run one after another.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ROOT, PROJECT, LOGS, CLAUDE_PROJECTS, projectDirName, parseArgs, listRuns, resolveRun, writeJson, fmtDuration, fmtInt } from "./lib/common.mjs";
import { VARIANTS, readPrompts } from "./lib/variants.mjs";
import { hasBaseline, changes } from "./lib/baseline.mjs";
import { stopSite } from "./lib/umbraco.mjs";
import { resolveClaudeBin, claudeVersion, authStatus, ClaudeSession } from "./lib/claude.mjs";
import { resolveCodexBin, codexVersion, codexAuth, CodexSession, mcpServerArgs, userMcpServerOffArgs, findRollout, DISABLED_FEATURES } from "./lib/codex.mjs";

const args = parseArgs();
const usage = `Usage: npm run auto                      (the sweep in run-book.json)
       npm run auto -- --model <alias|id>[:effort][,…] [--effort high] [--test mcp[,migrations,playwright]]
       npm run auto -- --grade-only [--run <id>]
Options: --runbook <file> (run-book.json)  --grader <model> (opus)  --grader-effort <level> (high)  --no-grade
         --permission-mode <mode> (auto)  --budget <usd per session>  --timeout <minutes for the blog prompt> (90)
         --claude <path to Claude CLI>  --codex <path to Codex CLI>  --quiet  --dry-run
Flags override the run-book.`;

// run-book.json: what a parameterless "npm run auto" sweeps. Flags override it.
const RUNBOOK_FILE = path.resolve(ROOT, typeof args.runbook === "string" ? args.runbook : "run-book.json");
let book = {};
if (fs.existsSync(RUNBOOK_FILE)) {
  try { book = JSON.parse(fs.readFileSync(RUNBOOK_FILE, "utf8")); } catch (e) { console.error(`✗ ${RUNBOOK_FILE} isn't valid JSON: ${e.message}`); process.exit(1); }
} else if (args.runbook) { console.error(`✗ No run-book at ${RUNBOOK_FILE}`); process.exit(1); }
const opt = (flag, value, fallback) => (args[flag] !== undefined && args[flag] !== true ? args[flag] : value ?? fallback);

const PERMISSION_MODE = opt("permission-mode", book.options?.permissionMode, "auto");
const GRADER = opt("grader", book.grader?.model, "opus");
const GRADER_EFFORT = opt("grader-effort", book.grader?.effort, "high");
const TIMEOUT_MS = Number(opt("timeout", book.options?.timeoutMinutes, 90)) * 60_000;
const BUDGET = opt("budget", book.options?.budgetUsd, null);
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const say = (...a) => console.log(...a);
const step = s => say(`\n▸ ${s}`);
const die = msg => { console.error(`\n✗ ${msg}`); process.exit(1); };

// ---------------------------------------------------------------- helpers

function bench(script, scriptArgs = [], { allowFail = false, quiet = false } = {}) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "bench", script), ...scriptArgs], { cwd: ROOT, encoding: "utf8", stdio: quiet ? "pipe" : "inherit" });
  if (r.status !== 0 && !allowFail) throw new Error(`bench/${script} ${scriptArgs.join(" ")} exited with ${r.status}${quiet ? `:\n${r.stderr || r.stdout}` : ""}`);
  return r;
}

const projectChanges = () => {
  const ch = changes();
  return [...ch.added, ...ch.modified, ...ch.deleted].filter(f => f !== ".mcp.json");
};

const runBySession = id => listRuns().find(r => r.metrics?.sessionId === id);

// OpenAI models run through Codex, everything else through Claude Code
const providerOf = model => /^(gpt|o\d|codex)/i.test(model) ? "openai" : "anthropic";

// "opus:high,gpt-5.6-terra" → [{ provider: "anthropic", model: "opus", effort: "high" }, { provider: "openai", model: "gpt-5.6-terra", effort: … }]
// Without --model: run-book anthropic.models, then openai.models, each with its section's effort.
// "sonnet-5-5" is short for "claude-sonnet-5-5". Haiku 4.5 has no effort setting, so it never gets --effort.
function parseModels() {
  const fromFlags = args.model || args.models;
  const flagEffort = args.effort !== undefined && args.effort !== true ? args.effort : undefined;
  const entries = fromFlags
    ? String(fromFlags).split(",").map(s => ({ s, section: null }))
    : ["anthropic", "openai"].flatMap(p => (book[p]?.models || []).map(s => ({ s, section: p })));
  return entries.map(({ s, section }) => ({ s: String(s).trim(), section })).filter(e => e.s).map(({ s, section }) => {
    let [model, effort] = s.split(":");
    if (/^(opus|sonnet|haiku|fable)-\d/i.test(model)) model = "claude-" + model;
    const provider = section || providerOf(model);
    effort = effort || flagEffort || book[provider]?.effort;
    if (/haiku/i.test(model) || effort === "default") effort = undefined;
    return { provider, model, effort };
  });
}

function parseTests() {
  const t = args.test || args.tests || book.run || "mcp";
  return (Array.isArray(t) ? t : String(t).split(",")).map(s => String(s).trim()).filter(Boolean);
}

let active = null; // the running Claude or Codex session, killed on Ctrl+C
process.on("SIGINT", () => {
  console.error("\nInterrupted — stopping the session and Umbraco.");
  active?.kill();
  stopSite();
  process.exit(130);
});

function session({ label, cwd, cliArgs, logFile }) {
  return (active = new ClaudeSession({ bin: BIN, cwd, args: cliArgs, logFile, label, quiet: !!args.quiet }).start());
}

// ---------------------------------------------------------------- grading

async function grade(run) {
  const m = run.metrics || {};
  const what = m.provider === "openai" ? "Codex thread" : "Claude Code session";
  step(`Grading ${run.id} with ${GRADER} (${GRADER_EFFORT}) — exam-prompt.md`);
  const logFile = path.join(LOGS, `auto-${stamp()}-grader.jsonl`);
  const cliArgs = ["--model", GRADER, "--effort", GRADER_EFFORT, "--permission-mode", PERMISSION_MODE, "--permission-prompts", "none",
    "--strict-mcp-config", "-n", `bench grader ${run.id}`, ...(BUDGET ? ["--max-budget-usd", String(BUDGET)] : [])];
  const s = session({ label: "grader", cwd: ROOT, cliArgs, logFile });
  const prompt = `Follow exam-prompt.md.

Context from the automated runner (bench/auto.mjs): the run to grade is ${run.id} (${what} ${m.sessionId}, a headless run). It has already been collected. For step 1, run exactly this instead of a bare "npm run collect", which only looks for Claude Code transcripts:
npm run collect -- --transcript "${m.transcript}"
It updates the same run in place.
Nobody is watching this session and nobody will answer questions: work autonomously and finish every step, including "npm run reset" and the final "npm run status".`;
  let turn;
  try {
    turn = await s.send(prompt, { timeoutMs: 60 * 60_000, settleMs: 15_000 });
  } finally {
    await s.close();
    active = null;
  }
  const graded = resolveRun(run.id);
  const info = {
    model: GRADER, effort: GRADER_EFFORT, durationMs: turn.durationMs, costUsd: turn.costUsd, isError: turn.isError,
    log: path.relative(ROOT, logFile), finalMessage: turn.text,
  };
  fs.copyFileSync(logFile, path.join(graded.dir, "grader-stream.jsonl"));
  return { graded, info };
}

// ---------------------------------------------------------------- one run

// ---------------------------------------------------------------- the model under test, per provider

// Claude Code: one `claude -p` process fed over stdin. Only the project's own settings and the test's MCP servers
// (from the .mcp.json setup just wrote): no user plugins, hooks, connectors or default model leak into the run.
function claudeDriver({ model, effort }, label, logFile, auto) {
  const sessionId = randomUUID();
  const mcpJson = path.join(PROJECT, ".mcp.json");
  const cliArgs = ["--model", model, ...(effort ? ["--effort", effort] : []), "--session-id", sessionId,
    "--permission-mode", PERMISSION_MODE, "--permission-prompts", "none", "--setting-sources", "project,local",
    "--strict-mcp-config", ...(fs.existsSync(mcpJson) ? ["--mcp-config", mcpJson] : []),
    "-n", `bench ${label}`, ...(BUDGET ? ["--max-budget-usd", String(BUDGET)] : [])];
  Object.assign(auto, { sessionId, claudeCli: BIN, claudeVersion: VERSION, permissionMode: PERMISSION_MODE, settingSources: "project,local" });
  const s = session({ label: "model", cwd: PROJECT, cliArgs, logFile });
  return {
    s, sessionId,
    send: (text, o) => s.send(text, o),
    // prompt 1 must have reached the test's tools, or the blog prompt would be a wasted run
    gate: async (t1, prefix) => {
      const servers = (t1.init?.mcp_servers || []).map(m => `${m.name}=${m.status}`).join(", ") || "none reported";
      const ok = t1.calls.filter(c => c.name.startsWith(prefix) && c.done && !c.isError).length;
      return { ok: ok > 0, servers, calls: ok, why: `no successful ${prefix}* call` };
    },
    transcript: () => {
      const f = path.join(CLAUDE_PROJECTS, projectDirName(PROJECT), `${sessionId}.jsonl`);
      return fs.existsSync(f) ? f : null;
    },
  };
}

// Codex: one `codex app-server` process, the test's MCP servers translated from .mcp.json, the desktop app's
// plugins, browser and computer use switched off. Full access with Codex's own automatic reviewer is the closest
// match to Claude Code's auto mode (its workspace sandbox blocks the network even when told not to).
async function codexDriver({ model, effort }, label, logFile, auto) {
  const mcp = mcpServerArgs(path.join(PROJECT, ".mcp.json"), PROJECT);
  const cliArgs = [...DISABLED_FEATURES.flatMap(f => ["--disable", f]), ...userMcpServerOffArgs(mcp.names), ...mcp.args];
  const thread = { model, approvalPolicy: "on-request", approvalsReviewer: "auto_review", sandbox: "danger-full-access" };
  const s = new CodexSession({ bin: CODEX, cwd: PROJECT, cliArgs, thread, logFile, label: "model", quiet: !!args.quiet });
  active = s;
  await s.open();
  Object.assign(auto, { sessionId: s.threadId, codexCli: CODEX, codexVersion: CODEX_VERSION, permissionMode: "on-request / auto_review / danger-full-access",
    disabledFeatures: DISABLED_FEATURES, mcpServers: mcp.names });
  return {
    s, sessionId: s.threadId,
    send: (text, o) => s.send(text, { ...o, effort }),
    // Codex finds MCP tools through its own tool search, and a model may answer without looking, so the server's
    // own status is the check: connected, with tools
    gate: async (t1, prefix) => {
      const status = await s.mcpStatus();
      const want = prefix.slice(5, -2);
      const srv = status.find(x => x.name === want);
      const calls = t1.calls.filter(c => c.name.startsWith(prefix) && !c.isError).length;
      return { ok: !!srv && srv.tools > 0 && srv.startup !== "failed", servers: status.map(x => `${x.name}=${x.startup ?? "?"} (${x.tools} tools)`).join(", "), calls,
        why: `the ${want} MCP server isn't connected with tools` };
    },
    transcript: () => findRollout(s.threadId),
  };
}

async function runOne({ provider, model, effort }, variant) {
  const v = VARIANTS[variant];
  const { prompt1, prompt2 } = readPrompts(variant);
  if (!prompt2 || (v.hasPrompt1 && !prompt1)) throw new Error(`Couldn't read the prompts from ${v.promptFile}`);
  const label = `${model}${effort ? ":" + effort : ""} · ${v.name}`;
  const logFile = path.join(LOGS, `auto-${stamp()}-${variant}-${model.replace(/[^a-z0-9.-]+/gi, "-")}.jsonl`);
  const t0 = Date.now();
  const auto = { driver: "bench/auto.mjs", provider, model, effort: effort ?? null, variant, startedAt: new Date().toISOString() };

  say(`\n════════ ${label} ════════`);
  const dirty = projectChanges();
  if (dirty.length) throw new Error(`Umbraco.Bench isn't pristine (${dirty.length} changed file(s)), so the last run hasn't been graded and reset. Run "npm run auto -- --grade-only" or follow exam-prompt.md, then retry.`);

  step(`Setting up the ${v.name} test`);
  bench("setup.mjs", [variant]);

  step("Booting Umbraco (first boot installs the database, outside the timing)");
  bench("up.mjs");
  if (!v.hasPrompt1) { step("Stopping Umbraco"); bench("down.mjs"); }

  const d = provider === "openai" ? await codexDriver({ model, effort }, label, logFile, auto) : claudeDriver({ model, effort }, label, logFile, auto);
  const { s, sessionId } = d;

  try {
    if (v.hasPrompt1) {
      step(`Prompt 1: ${prompt1}`);
      const t1 = await d.send(prompt1, { timeoutMs: 15 * 60_000, settleMs: 5_000 });
      auto.prompt1 = { durationMs: t1.durationMs, costUsd: t1.costUsd, isError: t1.isError, toolCalls: t1.calls.length };
      const prefix = variant === "playwright" ? "mcp__playwright__" : "mcp__umbraco__";
      const g = await d.gate(t1, prefix);
      Object.assign(auto.prompt1, { mcpServers: g.servers, successfulToolCalls: g.calls });
      if (t1.isError) throw new Error(`Prompt 1 ended in an error: ${t1.text || JSON.stringify(t1.result)}`);
      if (!g.ok) throw new Error(`Prompt 1: ${g.why} (MCP servers: ${g.servers}). Not sending the blog prompt.`);
      say(`  ✓ ${g.calls} successful ${prefix.slice(5, -2)} call(s); MCP servers: ${g.servers}`);
      step("Stopping Umbraco");
      bench("down.mjs");
    }

    step(`Prompt 2 (the blog), timeout ${fmtDuration(TIMEOUT_MS)}`);
    const t2 = await d.send(prompt2, { timeoutMs: TIMEOUT_MS, settleMs: 20_000 });
    auto.prompt2 = { durationMs: t2.durationMs, costUsd: t2.costUsd, isError: t2.isError, toolCalls: t2.calls.length,
      failedToolCalls: t2.calls.filter(c => c.isError).length, results: t2.results.length, terminalReason: t2.result?.terminal_reason ?? null,
      ...(t2.declined?.length ? { declinedRequests: t2.declined } : {}) };
    say(`\n  Blog prompt finished in ${fmtDuration(t2.durationMs)}, ${t2.calls.length} tool calls${provider === "anthropic" ? `, $${t2.costUsd.toFixed(2)}` : ""}${t2.isError ? " — ended in an ERROR" : ""}`);
    if (t2.text) say(`  Final report:\n${t2.text.split("\n").map(l => "    " + l).join("\n")}`);
  } finally {
    await s.close();
    active = null;
  }

  step("Collecting the run");
  const transcript = d.transcript();
  bench("collect.mjs", transcript ? ["--transcript", transcript] : ["--session", sessionId]);
  const run = runBySession(sessionId);
  if (!run) throw new Error(`collect didn't produce a run for session ${sessionId}`);
  auto.transcript = transcript;
  fs.copyFileSync(logFile, path.join(run.dir, provider === "openai" ? "codex-stream.jsonl" : "claude-stream.jsonl"));
  auto.runId = run.id;
  auto.log = path.relative(ROOT, logFile);
  writeJson(path.join(run.dir, "auto.json"), auto);

  if (args["no-grade"]) {
    say(`\nNot grading (--no-grade). Umbraco.Bench still holds the solution: grade it with "npm run auto -- --grade-only" or exam-prompt.md.`);
    return { label, run, ms: Date.now() - t0 };
  }

  const { graded, info } = await grade(resolveRun(run.id));
  auto.grader = info;
  writeJson(path.join(graded.dir, "auto.json"), auto);
  if (!graded.grade) throw new Error(`The grader finished without writing results/${run.id}/grade.json. Its log: ${info.log}`);
  const left = projectChanges();
  if (left.length) throw new Error(`Graded ${graded.grade.total}/${graded.grade.max}, but Umbraco.Bench wasn't reset (${left.length} changed file(s)). Run "npm run reset" before the next run.`);
  say(`\n  ✓ Graded ${graded.grade.total}/${graded.grade.max} — ${graded.grade.summary}`);
  return { label, run: graded, ms: Date.now() - t0 };
}

// ---------------------------------------------------------------- main

let BIN, VERSION;
try { BIN = resolveClaudeBin(args.claude); } catch (e) { die(e.message); }
VERSION = claudeVersion(BIN);
if (!hasBaseline()) die(`No baseline. Run "npm run baseline" on a pristine Umbraco.Bench first.`);

const models = parseModels();
const tests = parseTests();
for (const t of tests) if (!VARIANTS[t]) die(`Unknown test "${t}". Tests: ${Object.keys(VARIANTS).join(", ")}`);
if (!args["grade-only"] && !models.length) die(usage);
const matrix = models.flatMap(m => tests.map(t => ({ m, t })));
if (matrix.length > 1 && args["no-grade"]) die("--no-grade leaves the project un-reset, so it only works for a single run.");

say(`Run-book    ${fs.existsSync(RUNBOOK_FILE) ? path.relative(ROOT, RUNBOOK_FILE) + (args.model || args.models ? " (models from --model)" : "") : "none"}`);
say(`Claude CLI  ${BIN} (${VERSION ?? "version unknown"})`);
const auth = authStatus(BIN);
say(`Auth        ${auth.loggedIn ? `logged in (${auth.authMethod}${auth.email ? ", " + auth.email : ""})` : "NOT logged in"}`);
if (args["grade-only"]) say(`Plan        grade ${args.run ? args.run : "the newest run"} with ${GRADER} (${GRADER_EFFORT})`);
else {
  say(`Plan        ${matrix.length} run(s), one after another, permission mode ${PERMISSION_MODE}, ${args["no-grade"] ? "no grading" : `graded by ${GRADER} (${GRADER_EFFORT})`}`);
  for (const { m, t } of matrix) say(`              ${m.model}${m.effort ? ":" + m.effort : ""} · ${VARIANTS[t].name} · ${m.provider === "openai" ? "Codex" : "Claude Code"}`);
}
// Codex only when an OpenAI model is in the plan (the grader is always Claude Code)
let CODEX = null, CODEX_VERSION = null;
if (matrix.some(({ m }) => m.provider === "openai")) {
  try { CODEX = resolveCodexBin(args.codex); } catch (e) { die(e.message); }
  CODEX_VERSION = codexVersion(CODEX);
  const cAuth = codexAuth(CODEX);
  say(`Codex CLI   ${CODEX} (${CODEX_VERSION ?? "version unknown"}), ${cAuth.loggedIn ? `logged in (${cAuth.authMethod})` : "NOT logged in"}`);
  if (!cAuth.loggedIn) die(`Codex isn't logged in. Run "${CODEX}" login, then retry.`);
}
// Claude Code runs the anthropic models and every grading session
const needClaude = args["grade-only"] || !args["no-grade"] || matrix.some(({ m }) => m.provider === "anthropic");
if (needClaude && !auth.loggedIn) die(`The CLI isn't logged in. Run "${BIN}" auth login (or claude setup-token and set CLAUDE_CODE_OAUTH_TOKEN), then retry.`);
if (args["dry-run"]) { say("\nDry run — nothing started."); process.exit(0); }

const t0 = Date.now();
const done = [];
try {
  if (args["grade-only"]) {
    const run = resolveRun(args.run);
    if (run.grade) die(`${run.id} is already graded (${run.grade.total}/${run.grade.max}).`);
    const { graded, info } = await grade(run);
    const autoFile = path.join(graded.dir, "auto.json");
    writeJson(autoFile, { ...(graded.auto || {}), grader: info });
    if (!graded.grade) die(`The grader finished without writing grade.json. Its log: ${info.log}`);
    done.push({ label: run.id, run: graded, ms: Date.now() - t0 });
  } else {
    for (const { m, t } of matrix) done.push(await runOne(m, t));
  }
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  stopSite();
  process.exitCode = 1;
}

if (done.some(d => d.run.grade)) {
  step("Rebuilding the report");
  bench("report.mjs", [], { quiet: true, allowFail: true });
  say("  results/report.md and results/report.txt");
}
say(`\n════════ Summary (${fmtDuration(Date.now() - t0)}) ════════`);
for (const d of done) {
  const m = d.run.metrics;
  say(`  ${d.run.id.padEnd(46)} ${fmtDuration(m.time.blogPromptMs).padStart(6)}  ${fmtInt(m.tokens.total).padStart(11)} tok  ${d.run.grade ? `${d.run.grade.total}/${d.run.grade.max}` : "ungraded"}`);
}
if (process.exitCode) say("  (stopped early — see the error above; npm run status says what to do next)");
