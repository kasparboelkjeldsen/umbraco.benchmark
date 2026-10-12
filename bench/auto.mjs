// npm run auto                       — the sweep described in run-book.json
// npm run auto -- --model <alias|id>[:effort][,…] [--effort <level>] [--test <mcp|migrations|playwright>[,…]]
//                 [--grader opus] [--grader-effort high] [--no-grade] [--grade-only] [--permission-mode auto]
//                 [--budget <usd>] [--timeout <min>] [--claude <path>] [--codex <path>] [--quiet] [--dry-run]
// Runs the benchmark end to end without a human: sets up the test, boots Umbraco, plays the prompts from tests/<test>.md
// into one headless Claude Code or Codex session in Umbraco.Bench, collects the run, has a second headless session grade
// it with exam-prompt.md (which also resets the project), and rebuilds the report. Several models/tests run one after
// another, unattended: a failed attempt is archived and the sweep goes on, a run that hits a plan's usage limit is
// retried after the limit resets (other models run meanwhile), and the machine is kept awake while it runs.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { ROOT, PROJECT, LOGS, RESULTS, CLAUDE_PROJECTS, projectDirName, parseArgs, listRuns, resolveRun, writeJson, fmtDuration, fmtInt, readRunBook } from "./lib/common.mjs";
import { VARIANTS, readPrompts } from "./lib/variants.mjs";
import { hasBaseline, changes } from "./lib/baseline.mjs";
import { stopSite } from "./lib/umbraco.mjs";
import { modelDisplayName } from "./lib/transcript.mjs";
import { resolveClaudeBin, claudeVersion, authStatus, ClaudeSession, killTree } from "./lib/claude.mjs";
import { resolveLms, ensureServer, loadModel, unloadAll, startProxy, endpointSessionEnv, endpointSettings, endpointApiKey, endpointKeySource, endpointProviderOf, REMOTE_LIKE } from "./lib/local.mjs";
import { resolveCodexBin, codexVersion, codexAuth, codexRateLimits, isUsageLimitError, CodexSession, mcpServerArgs, userMcpServerOffArgs, findRollout, DISABLED_FEATURES } from "./lib/codex.mjs";
import { park, unpark, parkedRuns } from "./lib/park.mjs";
import { DEFAULT_POLICY, hookSettings } from "./lib/tripwire.mjs";

const args = parseArgs();
const usage = `Usage: npm run auto                      (the sweep in run-book.json)
       npm run auto -- --model <alias|id>[:effort][,…] [--effort high] [--test mcp[,migrations,playwright]]
       npm run auto -- --grade-only [--run <id>]   (without --run: every parked run, else the newest ungraded one)
Options: --runbook <file> (run-book.json)  --grader <model> (opus)  --grader-effort <level> (high)  --no-grade
         --airgapped (no internet: npm from its cache only, and each run is parked ungraded for --grade-only later; turns the tripwire on)
         --tripwire on|log|off (refuse and stop on installs, machine-wide kills, drive sweeps, system changes, DB writes; default: on when --airgapped)
         --permission-mode <mode> (auto)  --budget <usd per session>  --timeout <minutes for the blog prompt> (90)
         --codex-max-used <percent of the 5-hour window before a Codex run won't start> (75)
         --claude <path to Claude CLI>  --codex <path to Codex CLI>  --quiet  --dry-run
Flags override the run-book.`;

// run-book.json: what a parameterless "npm run auto" sweeps. Flags override it.
const RUNBOOK_FILE = path.resolve(ROOT, typeof args.runbook === "string" ? args.runbook : "run-book.json");
let book = {};
if (fs.existsSync(RUNBOOK_FILE)) {
  // with run-book.local.json (machine-specific settings) merged over it
  try { book = readRunBook(RUNBOOK_FILE); } catch (e) { console.error(`✗ ${RUNBOOK_FILE} (or run-book.local.json) isn't valid JSON: ${e.message}`); process.exit(1); }
} else if (args.runbook) { console.error(`✗ No run-book at ${RUNBOOK_FILE}`); process.exit(1); }
const opt = (flag, value, fallback) => (args[flag] !== undefined && args[flag] !== true ? args[flag] : value ?? fallback);

// On a network without internet (an airgapped endpoint): the grader can't run, so every collected run is parked
// (bench/lib/park.mjs) and the next one starts on a fresh scaffold; npm and npx (the MCP server, a model's npm install)
// use only their cache, so they fail at once instead of waiting on a network that isn't there. NuGet restores from
// ~/.nuget/packages on its own (the scaffold pins exact versions).
const AIRGAPPED = !!args.airgapped;
const AIRGAP_ENV = AIRGAPPED ? { npm_config_offline: "true", npm_config_audit: "false", npm_config_fund: "false", npm_config_update_notifier: "false" } : {};
const PARK = AIRGAPPED && !args["grade-only"];
// The tripwire (bench/lib/tripwire.mjs): a PreToolUse hook in the model's session, outside the project, that refuses
// installs, machine-wide process kills, drive sweeps, system changes and database writes and stops the run ("on"), or
// only records what it sees ("log"). On by default for --airgapped runs, where nobody is around to stop a model.
// run-book options.tripwire sets the default for other runs; options.tripwirePolicy overrides categories ({ "git": "deny" }).
const TRIPWIRE = String(args.tripwire ?? (AIRGAPPED ? "on" : book.options?.tripwire ?? "off"));
if (!["on", "log", "off"].includes(TRIPWIRE)) die(`--tripwire must be on, log or off (got ${TRIPWIRE})`);
const TRIPWIRE_POLICY = TRIPWIRE === "log" ? Object.fromEntries(Object.keys(DEFAULT_POLICY).map(k => [k, "log"])) : { ...DEFAULT_POLICY, ...(book.options?.tripwirePolicy || {}) };
const TRIPWIRE_DIR = path.join(ROOT, "bench", ".tripwire");
const PERMISSION_MODE = opt("permission-mode", book.options?.permissionMode, "auto");
const GRADER = opt("grader", book.grader?.model, "opus");
const GRADER_EFFORT = opt("grader-effort", book.grader?.effort, "high");
const TIMEOUT_MS = Number(opt("timeout", book.options?.timeoutMinutes, 90)) * 60_000;
// a local model on one consumer GPU is far slower than an API, so it gets its own blog-prompt timeout
// local (LM Studio), remote (an Anthropic-compatible API, e.g. DeepSeek) and openrouter (any "vendor/model" id on
// OpenRouter) models run through Claude Code + the proxy
const ENDPOINT_PROVIDERS = ["local", ...REMOTE_LIKE];
const isEndpoint = provider => ENDPOINT_PROVIDERS.includes(provider);
// (one value for the section, or { "<model>": minutes })
const timeoutFor = (provider, model) => {
  const min = isEndpoint(provider) && args.timeout === undefined ? Number(endpointSettings(book, provider, model).timeoutMinutes) : NaN;
  return min > 0 ? min * 60_000 : TIMEOUT_MS;
};
const HARNESS = { anthropic: "Claude Code", openai: "Codex", local: "Claude Code + LM Studio", remote: "Claude Code + API endpoint", openrouter: "Claude Code + OpenRouter" };
const BUDGET = opt("budget", book.options?.budgetUsd, null);
// one Codex run took ~15% of the Plus plan's 5-hour window; don't start one that would likely run out halfway
const CODEX_MAX_USED = Number(opt("codex-max-used", book.options?.codexMaxUsedPercent, 75));
const LIMIT_POLL_MS = 30 * 60_000;     // while waiting out a usage limit, look again this often
const MAX_LIMIT_WAITS = 8;             // per run, before giving up on it
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const clock = t => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const say = (...a) => console.log(...a);
const step = s => say(`\n▸ ${s}`);
const die = msg => { console.error(`\n✗ ${msg}`); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// The plan's allowance ran out: not the model's fault, so the attempt is discarded and retried once it resets
class LimitError extends Error { constructor(msg, notBefore) { super(msg); this.notBefore = notBefore; } }
// Something failed before the blog prompt (boot, MCP, the CLI itself): discarded and retried once
class InfraError extends Error {}

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

// Throws an attempt away: stops Umbraco and restores the pristine scaffold (database and build output included),
// archiving whatever the model wrote as refs/runs/<ref>
function discard(ref) {
  stopSite();
  const r = bench("reset.mjs", ["--force", "--as", ref], { allowFail: true, quiet: true });
  say(`  ↺ discarded the attempt (archived as refs/runs/${ref})${r.status ? " — reset reported a problem:\n" + (r.stderr || r.stdout) : ""}`);
}

// OpenAI models run through Codex, the run-book's local models through Claude Code + LM Studio, the rest through Claude Code
const providerOf = model => endpointProviderOf(book, model) ?? (/^(gpt|o\d|codex)/i.test(model) ? "openai" : "anthropic");

// "opus:high,gpt-5.6-terra" → [{ provider: "anthropic", model: "opus", effort: "high" }, { provider: "openai", model: "gpt-5.6-terra", effort: … }]
// Without --model: run-book anthropic.models, then openai.models, then local.models, each with its section's effort.
// "sonnet-5-5" is short for "claude-sonnet-5-5". Haiku 4.5 has no effort setting, so it never gets --effort.
function parseModels() {
  const fromFlags = args.model || args.models;
  const flagEffort = args.effort !== undefined && args.effort !== true ? args.effort : undefined;
  const entries = fromFlags
    ? String(fromFlags).split(",").map(s => ({ s, section: null }))
    : ["anthropic", "openai", "local", ...REMOTE_LIKE].filter(p => book[p]?.sweep !== false).flatMap(p => (book[p]?.models || []).map(s => ({ s, section: p })));
  return entries.map(({ s, section }) => ({ s: String(s).trim(), section })).filter(e => e.s).map(({ s, section }) => {
    // the effort is the part after the last ":" when it is one (OpenRouter ids can have a ":variant" of their own)
    const em = s.match(/^(.*):(low|medium|high|xhigh|max|default)$/i);
    let [model, effort] = em ? [em[1], em[2]] : [s, undefined];
    if (/^(opus|sonnet|haiku|fable)-\d/i.test(model)) model = "claude-" + model;
    const provider = section || providerOf(model);
    effort = effort || flagEffort || book[provider]?.effort;
    // Haiku 4.5 has no effort setting (Haiku 5.5 does)
    if (/haiku-4/i.test(model) || effort === "default") effort = undefined;
    return { provider, model, effort };
  });
}

function parseTests() {
  const t = args.test || args.tests || book.run || "mcp";
  return (Array.isArray(t) ? t : String(t).split(",")).map(s => String(s).trim()).filter(Boolean);
}

let active = null; // the running Claude or Codex session, killed on Ctrl+C
let releaseAwake = () => {};
process.on("SIGINT", () => {
  console.error("\nInterrupted — stopping the session and Umbraco.");
  active?.kill();
  stopSite();
  if (ENDPOINT?.lmsBin && !book.local?.keepLoaded) unloadAll(ENDPOINT.lmsBin);
  releaseAwake();
  process.exit(130);
});

// Asks Windows not to sleep while this process runs (SetThreadExecutionState from a helper that lives as long as we do).
// Nothing is changed in the power settings; the request ends with the process.
function keepAwake() {
  if (process.platform !== "win32") return () => {};
  const ps = `$t = Add-Type -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint f);' -Name Power -Namespace Bench -PassThru;
    $null = $t::SetThreadExecutionState([uint32]"0x80000001");
    while (Get-Process -Id ${process.pid} -ErrorAction SilentlyContinue) { Start-Sleep -Seconds 30 }`;
  const c = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { stdio: "ignore", windowsHide: true });
  return () => killTree(c.pid);
}

function session({ label, cwd, cliArgs, logFile, env = null }) {
  return (active = new ClaudeSession({ bin: BIN, cwd, args: cliArgs, logFile, label, quiet: !!args.quiet, env }).start());
}

// Endpoint models (run-book "local" and "remote"): the proxy in this process, plus for local ones LM Studio's server and
// the model loaded with the run-book's context length (unloaded when the sweep ends, so the GPU is free again).
let ENDPOINT = null;
async function ensureEndpoint(provider, model) {
  if (ENDPOINT?.model === model) { ENDPOINT.proxy.reset(); return ENDPOINT; }
  await closeEndpoint({ unload: false });
  const settings = endpointSettings(book, provider, model);
  const { contextLength, thinking, rewrite, usageFix, guard, maxOutputTokens, lmstudioKey, baseUrl, apiKeyEnv, dropFields, extraBody } = settings;
  let upstream = null, upstreamPort = null, apiKey = null, lmsBin = null, key = null;
  if (provider === "local") {
    lmsBin = resolveLms();
    if (!lmsBin) throw new InfraError("LM Studio's lms CLI isn't installed (~/.lmstudio/bin/lms)");
    key = lmstudioKey;
    step(`Local model: LM Studio, ${key} as "${model}", context ${contextLength}`);
    upstreamPort = ensureServer(lmsBin);
    const loaded = loadModel(lmsBin, { key, identifier: model, contextLength });
    say(`  LM Studio on port ${upstreamPort}; model ${loaded.reused ? "already loaded" : "loaded"}${loaded.info ? ` (${loaded.info})` : ""}`);
  } else {
    upstream = baseUrl;
    apiKey = endpointApiKey(settings);
    if (!upstream) throw new InfraError(`no base URL for ${model}: set ${provider}.baseUrl in run-book.json`);
    if (!apiKey) throw new InfraError(`no API key for ${model}: set the ${apiKeyEnv} environment variable`);
    step(`Remote model: ${model} at ${upstream}, context ${contextLength} (key from ${endpointKeySource(settings)})`);
  }
  const proxyLog = path.join(LOGS, `${provider}-proxy-${stamp()}-${model.replace(/[^a-z0-9.-]+/gi, "-")}.jsonl`);
  const proxy = await startProxy({ upstream, upstreamPort, apiKey, thinking, rewrite, usageFix, dropFields, extraBody, guard, log: line => fs.appendFileSync(proxyLog, line + "\n") });
  say(`  proxy on port ${proxy.port}: ${[rewrite && "one system message", !thinking && "thinking off", usageFix && "usage fix", dropFields.length && `dropping ${dropFields.join(", ")}`, extraBody && `adding ${JSON.stringify(extraBody)}`,
    `loop guard ${guard.loopLimit}`, guard.maxTokens && `max ${guard.maxTokens} tokens`, guard.maxUsd && `max $${guard.maxUsd}`].filter(Boolean).join(", ")}; requests logged to ${path.relative(ROOT, proxyLog)}`);
  ENDPOINT = { provider, model, key, contextLength, thinking, rewrite, usageFix, dropFields, guard: { ...guard, price: undefined }, upstream: upstream || `lmstudio:${upstreamPort}`,
    lmsBin, proxy, proxyLog: path.relative(ROOT, proxyLog),
    env: endpointSessionEnv({ proxyPort: proxy.port, identifier: model, contextLength, maxOutputTokens }) };
  return ENDPOINT;
}
async function closeEndpoint({ unload = true } = {}) {
  if (!ENDPOINT) return;
  await ENDPOINT.proxy.close().catch(() => {});
  if (unload && ENDPOINT.lmsBin && !book.local?.keepLoaded) unloadAll(ENDPOINT.lmsBin);
  ENDPOINT = null;
}

// A Claude Code turn that ended because the plan's limit was reached (resets within the 5-hour window)
const claudeLimit = turn => turn?.isError && isUsageLimitError(`${turn.text} ${JSON.stringify(turn.result ?? {})}`);

// Is the Codex allowance good for another run? Throws LimitError with the reset time when it isn't.
async function codexPreflight() {
  let rl;
  try { rl = await codexRateLimits(CODEX); } catch (e) { say(`  ⚠ couldn't read the Codex usage limits (${e.message}); trying anyway`); return null; }
  say(`  Codex allowance: ${rl.usedPercent}% of the 5-hour window used (resets ${rl.resetsAt ? clock(rl.resetsAt) : "?"}), ${rl.weeklyUsedPercent}% of the week`);
  if (rl.weeklyUsedPercent >= 95) throw new LimitError(`the weekly Codex allowance is ${rl.weeklyUsedPercent}% used`, (rl.weeklyResetsAt ?? Date.now() + 86_400_000) + 120_000);
  if (!rl.allowed || rl.limitReached || rl.usedPercent > CODEX_MAX_USED) throw new LimitError(`the Codex 5-hour window is ${rl.usedPercent}% used`, (rl.resetsAt ?? Date.now() + LIMIT_POLL_MS) + 120_000);
  return rl;
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
Other runs exist in results/, and this one may not be the newest (runs parked on an airgapped network are graded later). Pass --run ${run.id} to every script that takes it: npm run check -- --run ${run.id}, npm run screenshot -- --run ${run.id}, npm run reset -- --run ${run.id}.
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
  if (claudeLimit(turn)) throw new LimitError(`the grader hit the Claude usage limit: ${turn.text}`, Date.now() + LIMIT_POLL_MS);
  return { graded, info };
}

// The grader writes its own name into grade.json and can get its effort wrong (it said "low" for a high-effort session);
// the runner knows what it started, so that is what the grade records
function stampGrader(run) {
  const file = path.join(run.dir, "grade.json");
  const g = JSON.parse(fs.readFileSync(file, "utf8"));
  const actual = `${modelDisplayName(GRADER)} (${GRADER_EFFORT})`;
  if (g.grader !== actual) { g.graderSaidItWas = g.grader; g.grader = actual; writeJson(file, g); }
}

// Grades a collected run and makes sure the project ends up pristine. A grader that hits the Claude limit waits and
// tries again; one that fails twice leaves the run ungraded, archived under its own id.
async function gradeAndReset(run, auto) {
  let failures = 0, waits = 0;
  while (true) {
    try {
      const { graded, info } = await grade(resolveRun(run.id));
      auto.grader = info;
      writeJson(path.join(graded.dir, "auto.json"), auto);
      if (graded.grade) {
        stampGrader(graded);
        if (projectChanges().length) { say("  the grader didn't reset the project; resetting"); bench("reset.mjs", ["--run", run.id], { allowFail: true }); }
        return resolveRun(run.id);
      }
      say(`  ✗ the grader finished without writing grade.json (log: ${info.log})`);
    } catch (e) {
      if (e instanceof LimitError && ++waits <= MAX_LIMIT_WAITS) {
        say(`  ⏳ ${e.message}. Trying again at ${clock(e.notBefore)}.`);
        await sleep(e.notBefore - Date.now());
        continue;
      }
      say(`  ✗ grading failed: ${e.message}`);
    }
    if (++failures >= 2) break;
    stopSite();
    say("  grading once more");
  }
  stopSite();
  bench("reset.mjs", ["--force", "--run", run.id], { allowFail: true, quiet: true });
  auto.outcome = "ungraded: grading failed twice";
  writeJson(path.join(run.dir, "auto.json"), auto);
  return resolveRun(run.id);
}

// Before a sweep: a project left dirty by an earlier run gets that run graded (parked when airgapped), or is discarded
async function settleProject() {
  if (!projectChanges().length) return;
  const parked = new Set(parkedRuns().map(p => p.id));
  const last = listRuns().filter(r => !parked.has(r.id)).at(-1);
  if (last && !last.grade && PARK) {
    say(`Umbraco.Bench holds ${last.id}, which isn't graded yet: parking it for --grade-only.`);
    await parkRun(last, { ...(last.auto || {}) });
  } else if (last && !last.grade && !args["no-grade"]) {
    say(`Umbraco.Bench holds ${last.id}, which isn't graded yet: grading it first.`);
    await gradeAndReset(last, { ...(last.auto || {}) });
  }
  if (projectChanges().length) discard(`leftover-${stamp()}`);
}

async function parkRun(run, auto) {
  step(`Parking ${run.id} (no grading while airgapped)`);
  auto.parked = path.relative(ROOT, await park(run.id));
  writeJson(path.join(run.dir, "auto.json"), auto);
  say(`  moved to ${auto.parked}; Umbraco.Bench is pristine again. Back online: npm run auto -- --grade-only`);
}

// ---------------------------------------------------------------- the model under test, per provider

// Claude Code: one `claude -p` process fed over stdin. Only the project's own settings and the test's MCP servers
// (from the .mcp.json setup just wrote): no user plugins, hooks, connectors or default model leak into the run.
// Auto mode isn't available for every model (Haiku 4.5 starts in "default" instead, and headless that denies every
// write). Those run with bypassPermissions, the nearest thing: nothing asks, nothing is refused. auto.json records it.
const PERMISSION_FALLBACK = new Map();
// Local models too: auto mode's safety classifier would run on the local model itself.
const permissionModeFor = model => PERMISSION_FALLBACK.get(model) ?? (PERMISSION_MODE === "auto" && (/haiku-4/i.test(model) || isEndpoint(providerOf(model))) ? "bypassPermissions" : PERMISSION_MODE);

function claudeDriver({ model, effort }, label, logFile, auto, local = null) {
  const sessionId = randomUUID();
  const mcpJson = path.join(PROJECT, ".mcp.json");
  const mode = permissionModeFor(model);
  const cliArgs = ["--model", model, ...(effort ? ["--effort", effort] : []), "--session-id", sessionId,
    "--permission-mode", mode, "--permission-prompts", "none", "--setting-sources", "project,local",
    "--strict-mcp-config", ...(fs.existsSync(mcpJson) ? ["--mcp-config", mcpJson] : []),
    "-n", `bench ${label}`, ...(BUDGET ? ["--max-budget-usd", String(BUDGET)] : [])];
  Object.assign(auto, { sessionId, claudeCli: BIN, claudeVersion: VERSION, permissionMode: mode, settingSources: "project,local",
    ...(local ? { endpoint: { provider: local.provider, upstream: local.upstream, model: local.key ?? model, identifier: model, contextLength: local.contextLength,
      thinking: local.thinking, rewrite: local.rewrite, usageFix: local.usageFix, ...(local.dropFields?.length ? { dropFields: local.dropFields } : {}),
      guard: local.guard, proxyLog: local.proxyLog } } : {}),
    ...(mode !== PERMISSION_MODE ? { permissionFallback: `${PERMISSION_MODE} mode isn't available for ${model}; ran with ${mode}` } : {}) });
  if (mode !== PERMISSION_MODE) say(`  ⚠ ${PERMISSION_MODE} mode isn't available for ${model}: running with ${mode}`);
  // the tripwire hook comes in through --settings from bench/.tripwire (outside the project: the model can't see or change
  // it, and --setting-sources doesn't filter it); it writes every hit to the trip file, which is watched here
  let tripEnv = {}, tripFile = null, tripWatch = null, tripped = null;
  if (TRIPWIRE !== "off") {
    fs.mkdirSync(TRIPWIRE_DIR, { recursive: true });
    const settingsFile = path.join(TRIPWIRE_DIR, `${sessionId}.settings.json`);
    tripFile = path.join(TRIPWIRE_DIR, `${sessionId}.jsonl`);
    writeJson(settingsFile, hookSettings({ node: process.execPath, hookScript: path.join(ROOT, "bench", "lib", "tripwire-hook.mjs") }));
    cliArgs.push("--settings", settingsFile);
    tripEnv = { BENCH_TRIPWIRE_FILE: tripFile, BENCH_TRIPWIRE_POLICY: JSON.stringify(TRIPWIRE_POLICY), BENCH_PROJECT: PROJECT };
    auto.tripwire = { mode: TRIPWIRE, policy: TRIPWIRE_POLICY };
  }
  const s = session({ label: "model", cwd: PROJECT, cliArgs, logFile, env: { ...(local?.env ?? {}), ...AIRGAP_ENV, ...tripEnv } });
  if (tripFile) {
    let seen = 0;
    tripWatch = setInterval(() => {
      if (tripped || !fs.existsSync(tripFile)) return;
      const lines = fs.readFileSync(tripFile, "utf8").split("\n").filter(Boolean);
      for (const l of lines.slice(seen)) {
        let e; try { e = JSON.parse(l); } catch { continue; }
        if (e.action === "kill") {
          tripped = e;
          say(`\n  ⛔ tripwire (${e.categories.join(", ")}): ${e.tool} ${String(e.detail).replace(/\s+/g, " ").slice(0, 140)} — stopping the session`);
          s.kill();
          break;
        }
        if (e.action === "deny") say(`  ⚠ tripwire refused (${e.categories.join(", ")}): ${String(e.detail).replace(/\s+/g, " ").slice(0, 140)}`);
      }
      seen = lines.length;
    }, 1000);
  }
  return {
    s, sessionId,
    tripped: () => tripped,
    // stops watching and returns what the hook recorded (copied into the run folder by the caller)
    tripReport: () => {
      clearInterval(tripWatch);
      if (!tripFile) return null;
      const events = fs.existsSync(tripFile) ? fs.readFileSync(tripFile, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
      const counts = {};
      for (const e of events) { const k = `${e.action}:${e.categories[0]}`; counts[k] = (counts[k] || 0) + 1; }
      return { file: tripFile, events, counts, tripped };
    },
    send: (text, o) => s.send(text, o),
    limit: turn => claudeLimit(turn) ? Date.now() + LIMIT_POLL_MS : null,
    // prompt 1 must have reached the test's tools, or the blog prompt would be a wasted run: a successful call, or the
    // server reported connected (the same bar as Codex: a model may answer "connected" without calling anything)
    gate: async (t1, prefix) => {
      const want = prefix.slice(5, -2);
      const servers = (t1.init?.mcp_servers || []).map(m => `${m.name}=${m.status}`).join(", ") || "none reported";
      const ok = t1.calls.filter(c => c.name.startsWith(prefix) && c.done && !c.isError).length;
      const connected = (t1.init?.mcp_servers || []).some(m => m.name === want && m.status === "connected");
      return { ok: ok > 0 || connected, servers, calls: ok, why: `no successful ${prefix}* call and ${want} isn't connected` };
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
  // the first turn's tools are fixed when it starts: wait for the MCP servers, or the model never sees their tools
  if (!(await s.waitForMcp(mcp.names))) console.log(`  ⚠ MCP server(s) ${mcp.names.join(", ")} not ready after 2 min; starting anyway`);
  Object.assign(auto, { sessionId: s.threadId, codexCli: CODEX, codexVersion: CODEX_VERSION, permissionMode: "on-request / auto_review / danger-full-access",
    disabledFeatures: DISABLED_FEATURES, mcpServers: mcp.names });
  return {
    s, sessionId: s.threadId,
    send: (text, o) => s.send(text, { ...o, effort }),
    // a turn that failed on the plan's allowance; the reset time comes from the usage windows
    limit: async turn => {
      if (!turn?.isError || !isUsageLimitError(JSON.stringify([turn.errors, turn.result, turn.text]))) return null;
      const rl = await codexRateLimits(CODEX).catch(() => null);
      return (rl?.resetsAt ?? Date.now() + LIMIT_POLL_MS) + 120_000;
    },
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

// ---------------------------------------------------------------- one run

async function runOne({ provider, model, effort }, variant) {
  const v = VARIANTS[variant];
  const { prompt1, prompt2 } = readPrompts(variant);
  if (!prompt2 || (v.hasPrompt1 && !prompt1)) throw new Error(`Couldn't read the prompts from ${v.promptFile}`);
  const label = `${model}${effort ? ":" + effort : ""} · ${v.name}`;
  const logFile = path.join(LOGS, `auto-${stamp()}-${variant}-${model.replace(/[^a-z0-9.-]+/gi, "-")}.jsonl`);
  const t0 = Date.now();
  const auto = { driver: "bench/auto.mjs", provider, model, effort: effort ?? null, variant, startedAt: new Date().toISOString(), ...(AIRGAPPED ? { airgapped: true } : {}) };

  say(`\n════════ ${label} ════════  (${clock(t0)})`);
  const dirty = projectChanges();
  if (dirty.length) throw new InfraError(`Umbraco.Bench isn't pristine (${dirty.length} changed file(s)).`);
  if (provider === "openai") await codexPreflight();

  // ---- everything up to the blog prompt is infrastructure: a failure here says nothing about the model
  let d, sessionId;
  try {
    step(`Setting up the ${v.name} test`);
    bench("setup.mjs", [variant]);
    step("Booting Umbraco (first boot installs the database, outside the timing)");
    bench("up.mjs");
    if (!v.hasPrompt1) { step("Stopping Umbraco"); bench("down.mjs"); }
    d = provider === "openai" ? await codexDriver({ model, effort }, label, logFile, auto)
      : claudeDriver({ model, effort }, label, logFile, auto, isEndpoint(provider) ? await ensureEndpoint(provider, model) : null);
    sessionId = d.sessionId;
    if (v.hasPrompt1) {
      step(`Prompt 1: ${prompt1}`);
      const t1 = await d.send(prompt1, { timeoutMs: (isEndpoint(provider) ? 45 : 15) * 60_000, settleMs: 5_000 });
      auto.prompt1 = { durationMs: t1.durationMs, costUsd: t1.costUsd, isError: t1.isError, toolCalls: t1.calls.length };
      const limitedUntil = await d.limit(t1);
      if (limitedUntil) throw new LimitError(`${provider === "openai" ? "Codex" : "Claude"} usage limit reached during prompt 1`, limitedUntil);
      const prefix = variant === "playwright" ? "mcp__playwright__" : "mcp__umbraco__";
      const g = await d.gate(t1, prefix);
      Object.assign(auto.prompt1, { mcpServers: g.servers, successfulToolCalls: g.calls });
      if (t1.isError) throw new InfraError(`Prompt 1 ended in an error: ${t1.text || JSON.stringify(t1.result)}`);
      if (!g.ok) throw new InfraError(`Prompt 1: ${g.why} (MCP servers: ${g.servers}). Not sending the blog prompt.`);
      // a test with several MCP servers (guided: dev + Editor) needs all of them
      const missing = (v.servers || []).filter(n => !(t1.init?.mcp_servers || []).some(m => m.name === n && m.status === "connected"));
      if (provider !== "openai" && missing.length) throw new InfraError(`Prompt 1: MCP server(s) ${missing.join(", ")} not connected (${g.servers}). Not sending the blog prompt.`);
      say(`  ✓ ${g.calls} successful ${prefix.slice(5, -2)} call(s); MCP servers: ${g.servers}`);
      step("Stopping Umbraco");
      bench("down.mjs");
    }
  } catch (e) {
    if (d) { await d.s.close().catch(() => {}); active = null; }
    // a trip during prompt 1 ends the attempt like any other prompt-1 failure (discarded, retried once), but says why
    const trip = d?.tripped?.();
    d?.tripReport?.();
    if (trip) e = new InfraError(`the tripwire stopped prompt 1 (${trip.categories.join(", ")}): ${trip.tool} ${String(trip.detail).slice(0, 160)}`);
    // started in another permission mode than asked: the retry uses the fallback
    if (provider !== "openai" && /permission mode "default", not "auto"/.test(e.message) && !PERMISSION_FALLBACK.has(model)) PERMISSION_FALLBACK.set(model, "bypassPermissions");
    throw e instanceof LimitError || e instanceof InfraError ? e : new InfraError(e.message);
  }

  // ---- the blog prompt: a timeout or an error is the model's result and is graded as it stands, a usage limit isn't
  try {
    step(`Prompt 2 (the blog), timeout ${fmtDuration(timeoutFor(provider, model))}`);
    let t2;
    try {
      t2 = await d.send(prompt2, { timeoutMs: timeoutFor(provider, model), settleMs: 20_000 });
    } catch (e) {
      // the tripwire stopped the session: like a timeout, the run is collected and graded as it stands
      const trip = d.tripped?.();
      if (trip) {
        auto.prompt2 = { tripped: true, trip: { tool: trip.tool, categories: trip.categories, detail: trip.detail, at: trip.at } };
        say(`\n  ⛔ stopped by the tripwire (${trip.categories.join(", ")}) — collecting and grading what it built`);
      } else {
        if (!/timed out/i.test(e.message)) throw new InfraError(`the session broke during the blog prompt: ${e.message}`);
        auto.prompt2 = { timedOut: true, error: e.message };
        say(`\n  ✗ ${e.message} — collecting and grading what it built`);
      }
    }
    if (t2) {
      const limitedUntil = await d.limit(t2);
      if (limitedUntil) throw new LimitError(`${provider === "openai" ? "Codex" : "Claude"} usage limit reached during the blog prompt`, limitedUntil);
      auto.prompt2 = { durationMs: t2.durationMs, costUsd: t2.costUsd, isError: t2.isError, toolCalls: t2.calls.length,
        failedToolCalls: t2.calls.filter(c => c.isError).length, results: t2.results.length, terminalReason: t2.result?.terminal_reason ?? null,
        ...(t2.declined?.length ? { declinedRequests: t2.declined } : {}) };
      say(`\n  Blog prompt finished in ${fmtDuration(t2.durationMs)}, ${t2.calls.length} tool calls${provider === "anthropic" ? `, $${t2.costUsd.toFixed(2)}` : ""}${t2.isError ? " — ended in an ERROR" : ""}`);
      if (t2.text) say(`  Final report:\n${t2.text.split("\n").map(l => "    " + l).join("\n")}`);
    }
  } finally {
    await d.s.close();
    active = null;
  }
  // what went through the proxy: tokens, cost at the run-book price, and whether a guard stopped the run
  if (isEndpoint(provider) && ENDPOINT) {
    auto.endpointStats = ENDPOINT.proxy.stats();
    if (auto.endpointStats.stopped) say(`  ⚠ the benchmark guard stopped this run: ${auto.endpointStats.stopped}`);
  }

  step("Collecting the run");
  const transcript = d.transcript();
  const c = bench("collect.mjs", transcript ? ["--transcript", transcript] : ["--session", sessionId], { allowFail: true });
  const run = runBySession(sessionId);
  if (c.status !== 0 || !run) throw new InfraError(`collect didn't produce a run for session ${sessionId}`);
  auto.transcript = transcript;
  fs.copyFileSync(logFile, path.join(run.dir, provider === "openai" ? "codex-stream.jsonl" : "claude-stream.jsonl"));
  auto.runId = run.id;
  auto.log = path.relative(ROOT, logFile);
  // what the tripwire saw: counts in auto.json, every hit in the run folder
  const trips = d.tripReport?.();
  if (trips) {
    Object.assign(auto.tripwire, { counts: trips.counts, ...(trips.tripped ? { tripped: trips.tripped } : {}) });
    if (trips.events.length) fs.copyFileSync(trips.file, path.join(run.dir, "tripwire.jsonl"));
    if (Object.keys(trips.counts).length) say(`  tripwire: ${Object.entries(trips.counts).map(([k, v]) => `${k} ×${v}`).join(", ")}`);
  }
  writeJson(path.join(run.dir, "auto.json"), auto);

  if (PARK) {
    await parkRun(run, auto);
    return { label, run, ms: Date.now() - t0, status: "parked" };
  }
  if (args["no-grade"]) {
    say(`\nNot grading (--no-grade). Umbraco.Bench still holds the solution: grade it with "npm run auto -- --grade-only" or exam-prompt.md.`);
    return { label, run, ms: Date.now() - t0, status: "ungraded" };
  }

  const graded = await gradeAndReset(run, auto);
  if (graded.grade) say(`\n  ✓ Graded ${graded.grade.total}/${graded.grade.max} — ${graded.grade.summary}`);
  return { label, run: graded, ms: Date.now() - t0, status: graded.grade ? "graded" : "ungraded" };
}

// ---------------------------------------------------------------- main

let BIN, VERSION;
try { BIN = resolveClaudeBin(args.claude); } catch (e) { die(e.message); }
VERSION = claudeVersion(BIN);
// Clean room: inside a git checkout (such as a clone of the umbraco.benchmark repo), a model under test that runs git
// in Umbraco.Bench finds the whole repo, archive of other models' solutions and grades included. Runs belong in a
// folder of their own, installed with tools/Get-UmbracoBenchmark.ps1.
{
  const g = spawnSync("git", ["-C", PROJECT, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true });
  if (g.status === 0 && !args["allow-git-checkout"])
    die(`${PROJECT} is inside the git checkout ${g.stdout.trim()}. A model under test could read the whole repo from there.\n  Run from a folder outside git (tools/Get-UmbracoBenchmark.ps1 installs one), or pass --allow-git-checkout.`);
}
if (!hasBaseline()) die(`No baseline. Run "npm run baseline" on a pristine Umbraco.Bench first.`);

const models = parseModels();
const tests = parseTests();
for (const t of tests) if (!VARIANTS[t]) die(`Unknown test "${t}". Tests: ${Object.keys(VARIANTS).join(", ")}`);
if (!args["grade-only"] && !models.length) die(usage);
const matrix = models.flatMap(m => tests.map(t => ({ m, t })));
if (matrix.length > 1 && args["no-grade"] && !PARK) die("--no-grade leaves the project un-reset, so it only works for a single run (--airgapped parks each run instead).");

say(`Run-book    ${fs.existsSync(RUNBOOK_FILE) ? path.relative(ROOT, RUNBOOK_FILE) + (fs.existsSync(path.join(path.dirname(RUNBOOK_FILE), "run-book.local.json")) ? " + run-book.local.json" : "") + (args.model || args.models ? " (models from --model)" : "") : "none"}`);
say(`Claude CLI  ${BIN} (${VERSION ?? "version unknown"})`);
const auth = authStatus(BIN);
say(`Auth        ${auth.loggedIn ? `logged in (${auth.authMethod}${auth.email ? ", " + auth.email : ""})` : "NOT logged in"}`);
const PARKED_NOW = parkedRuns();
const IN_PROJECT = args["grade-only"] && !args.run && PARKED_NOW.length && projectChanges().length
  ? listRuns().filter(r => !r.grade && !PARKED_NOW.some(p => p.id === r.id)).at(-1) : null;
if (args["grade-only"]) say(`Plan        grade ${args.run ? args.run : PARKED_NOW.length ? [IN_PROJECT && `${IN_PROJECT.id} (in the project)`, `the ${PARKED_NOW.length} parked run(s): ${PARKED_NOW.map(p => p.id).join(", ")}`].filter(Boolean).join(", then ") : "the newest run"} with ${GRADER} (${GRADER_EFFORT})`);
else {
  say(`Plan        ${matrix.length} run(s), one after another, permission mode ${PERMISSION_MODE}, ${PARK ? "AIRGAPPED: npm offline, each run parked for grading later" : args["no-grade"] ? "no grading" : `graded by ${GRADER} (${GRADER_EFFORT})`}`);
  if (TRIPWIRE !== "off") say(`Tripwire    ${TRIPWIRE === "on" ? `on: stops the run on ${Object.entries(TRIPWIRE_POLICY).filter(([, a]) => a === "kill").map(([c]) => c).join(", ")}; refuses ${Object.entries(TRIPWIRE_POLICY).filter(([, a]) => a === "deny").map(([c]) => c).join(", ") || "nothing else"}` : "log only"} (Claude Code runs; not Codex)`);
  for (const { m, t } of matrix) {
    say(`              ${m.model}${m.effort ? ":" + m.effort : ""} · ${VARIANTS[t].name} · ${HARNESS[m.provider]}`);
    if (REMOTE_LIKE.includes(m.provider)) {
      const s = endpointSettings(book, m.provider, m.model);
      say(`                at ${s.baseUrl ?? "(no base URL!)"}, key from ${endpointKeySource(s)}${endpointApiKey(s) ? "" : " (NOT SET)"}, context ${s.contextLength}, thinking ${s.thinking ? "on" : "off"}, blog prompt timeout ${fmtDuration(timeoutFor(m.provider, m.model))}`);
    }
  }
}
// Codex only when an OpenAI model is in the plan (the grader is always Claude Code)
let CODEX = null, CODEX_VERSION = null;
if (!args["grade-only"] && matrix.some(({ m }) => m.provider === "openai")) {
  try { CODEX = resolveCodexBin(args.codex); } catch (e) { die(e.message); }
  CODEX_VERSION = codexVersion(CODEX);
  const cAuth = codexAuth(CODEX);
  say(`Codex CLI   ${CODEX} (${CODEX_VERSION ?? "version unknown"}), ${cAuth.loggedIn ? `logged in (${cAuth.authMethod})` : "NOT logged in"}`);
  if (!cAuth.loggedIn) die(`Codex isn't logged in. Run "${CODEX}" login, then retry.`);
  const rl = await codexRateLimits(CODEX).catch(() => null);
  if (rl) say(`Codex use   ${rl.usedPercent}% of the 5-hour window (resets ${rl.resetsAt ? clock(rl.resetsAt) : "?"}), ${rl.weeklyUsedPercent}% of the week, ${rl.plan} plan; a run starts only at ≤${CODEX_MAX_USED}%`);
}
// Claude Code runs the anthropic models and every grading session
const needClaude = args["grade-only"] || (!args["no-grade"] && !PARK) || matrix.some(({ m }) => m.provider !== "openai");
if (needClaude && !auth.loggedIn) die(`The CLI isn't logged in. Run "${BIN}" auth login (or claude setup-token and set CLAUDE_CODE_OAUTH_TOKEN), then retry.`);
if (args["dry-run"]) { say("\nDry run — nothing started."); process.exit(0); }

releaseAwake = keepAwake();
const t0 = Date.now();
const done = [];
const SWEEP_LOG = path.join(RESULTS, `sweep-${stamp()}.json`);
const queue = matrix.map(({ m, t }) => ({ m, t, label: `${m.model}${m.effort ? ":" + m.effort : ""} · ${VARIANTS[t].name}`, infraTries: 0, limitWaits: 0, notBefore: 0 }));
const writeSweepLog = (state = "running") => {
  if (args["grade-only"]) return;
  writeJson(SWEEP_LOG, {
    state, startedAt: new Date(t0).toISOString(), updatedAt: new Date().toISOString(),
    done: done.map(d => ({ label: d.label, status: d.status, runId: d.run?.id ?? null, grade: d.run?.grade ? `${d.run.grade.total}/${d.run.grade.max}` : null, error: d.error ?? null })),
    queued: queue.map(q => ({ label: q.label, notBefore: q.notBefore ? new Date(q.notBefore).toISOString() : null, infraTries: q.infraTries, limitWaits: q.limitWaits })),
  });
};

try {
  if (args["grade-only"]) {
    const parkedIds = new Set(PARKED_NOW.map(p => p.id));
    // --run <id>, else every parked run (oldest first; a project still holding an ungraded run goes first), else the newest
    let targets;
    if (args.run) targets = [resolveRun(args.run)];
    else if (PARKED_NOW.length) targets = [...(IN_PROJECT ? [IN_PROJECT] : []), ...PARKED_NOW.map(p => resolveRun(p.id))];
    else targets = [resolveRun()];
    for (const run of targets) {
      if (run.grade) { say(`${run.id} is already graded (${run.grade.total}/${run.grade.max}).`); continue; }
      if (parkedIds.has(run.id)) {
        step(`Unparking ${run.id}`);
        try { await unpark(run.id); } catch (e) { say(`  ✗ ${e.message}`); done.push({ label: run.id, status: "failed", error: e.message }); continue; }
      }
      const graded = await gradeAndReset(run, { ...(run.auto || {}) });
      done.push({ label: run.id, run: graded, status: graded.grade ? "graded" : "ungraded" });
    }
    if (done.some(d => d.status !== "graded")) process.exitCode = 1;
  } else {
    await settleProject();
    writeSweepLog();
    while (queue.length) {
      const now = Date.now();
      const i = queue.findIndex(q => q.notBefore <= now);
      if (i < 0) {
        // everything left is waiting out a usage limit: sleep (in steps, looking at Codex's windows meanwhile)
        const wake = Math.min(...queue.map(q => q.notBefore));
        say(`\n⏳ Waiting for usage limits to reset — next try at ${clock(wake)} (${queue.map(q => q.label).join(", ")})`);
        await sleep(Math.max(60_000, Math.min(wake - now, LIMIT_POLL_MS)));
        if (CODEX && queue.some(q => q.m.provider === "openai" && q.notBefore > Date.now())) {
          const rl = await codexRateLimits(CODEX).catch(() => null);
          if (rl) say(`  Codex allowance: ${rl.usedPercent}% used (resets ${rl.resetsAt ? clock(rl.resetsAt) : "?"})`);
          if (rl && rl.allowed && !rl.limitReached && rl.usedPercent <= CODEX_MAX_USED && rl.weeklyUsedPercent < 95)
            for (const q of queue) if (q.m.provider === "openai") q.notBefore = 0;
        }
        continue;
      }
      const q = queue.splice(i, 1)[0];
      writeSweepLog();
      try {
        done.push(await runOne(q.m, q.t));
      } catch (e) {
        active?.kill(); active = null;
        console.error(`\n✗ ${q.label}: ${e.message}`);
        const tag = `${e instanceof LimitError ? "limited" : "failed"}-${q.m.model}-${stamp()}`.replace(/[^a-z0-9.-]+/gi, "-");
        discard(tag);
        if (e instanceof LimitError && ++q.limitWaits <= MAX_LIMIT_WAITS) {
          q.notBefore = e.notBefore;
          // the whole provider is limited, not just this model
          for (const o of queue) if (o.m.provider === q.m.provider) o.notBefore = Math.max(o.notBefore, e.notBefore);
          queue.splice(i, 0, q);
          say(`  ⏳ ${q.label} goes back in the queue; ${q.m.provider === "openai" ? "Codex" : "Claude"} runs wait until ${clock(e.notBefore)}, others go first.`);
        } else if (e instanceof InfraError && ++q.infraTries <= 1) {
          queue.splice(i, 0, q);
          say(`  ↻ trying ${q.label} once more`);
        } else {
          done.push({ label: q.label, status: "failed", error: e.message });
          say(`  ✗ giving up on ${q.label}`);
        }
      }
      writeSweepLog();
    }
  }
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  stopSite();
  process.exitCode = 1;
}
writeSweepLog(process.exitCode ? "stopped" : "finished");
await closeEndpoint();
releaseAwake();

if (done.some(d => d.run?.grade)) {
  step("Rebuilding the report");
  bench("report.mjs", [], { quiet: true, allowFail: true });
  say("  results/report.md and results/report.txt");
}
say(`\n════════ Summary (${fmtDuration(Date.now() - t0)}) ════════`);
for (const d of done) {
  if (!d.run) { say(`  ${d.label.padEnd(46)} FAILED: ${d.error}`); continue; }
  const m = d.run.metrics;
  say(`  ${d.run.id.padEnd(46)} ${fmtDuration(m.time.blogPromptMs).padStart(6)}  ${fmtInt(m.tokens.total).padStart(11)} tok  ${d.run.grade ? `${d.run.grade.total}/${d.run.grade.max}` : d.status === "parked" ? "parked, not graded" : "ungraded"}`);
}
if (PARK && parkedRuns().length) say(`\n${parkedRuns().length} parked run(s) waiting for a grader. Back on a network with internet:  npm run auto -- --grade-only`);
// --no-grade asks for an ungraded run, and --airgapped for parked ones, so that is success
if (done.some(d => d.status !== "graded" && !(args["no-grade"] && d.status === "ungraded") && d.status !== "parked")) process.exitCode = process.exitCode || 1;
