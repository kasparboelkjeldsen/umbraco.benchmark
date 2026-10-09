// npm run preflight -- --model <id> [--quick | --offline] [--claude <path>]
// A few minutes of checks before spending real time on a local or remote (API) model run, so that problems show up
// now and not halfway through the blog prompt. Every check talks to the endpoint through the same proxy the runner uses,
// with the run-book's settings:
//   1. run-book entry, API key present (never printed), Claude CLI logged in (for the grader)
//   2. the models the endpoint serves (/v1/models: the exact id, and the context length a vLLM server was started with);
//      the endpoint answers, and how fast; a tool call comes back as a tool call
//   3. token usage counting: input_tokens must not include the cached part (else Claude Code compacts far too early)
//   4. mid-conversation system messages, as Claude Code sends them, are accepted (else: rewrite)
//   5. thinking: how much the model thinks on a small question, and whether it can be switched off
//   6. Claude Code end to end on a tiny task in a temp folder
//   7. (not with --quick) the benchmark itself: baseline, pristine project, Umbraco boots, the MCP server lists its tools
// --offline skips 2–6: nothing is sent to the endpoint, so the machine's side can be checked before the endpoint is free.
// Ends with the run-book settings it recommends and the command to start a run.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { ROOT, PROJECT, parseArgs, readRunBook } from "./lib/common.mjs";
import { resolveClaudeBin, authStatus, cleanEnv } from "./lib/claude.mjs";
import { resolveLms, ensureServer, loadModel, startProxy, endpointSessionEnv, endpointSettings, endpointApiKey, endpointKeySource, endpointProviderOf, REMOTE_LIKE } from "./lib/local.mjs";
import { hasBaseline, changes } from "./lib/baseline.mjs";

const args = parseArgs();
const model = typeof args.model === "string" ? args.model : null;
if (!model) { console.error("Usage: npm run preflight -- --model <id> [--quick | --offline]"); process.exit(1); }
const offline = !!args.offline;
const book = readRunBook();
const provider = endpointProviderOf(book, model);

const results = [];
const recommend = {};
const say = (...a) => console.log(...a);
const check = (ok, name, detail = "") => { results.push({ ok, name }); say(`${ok === true ? "✓" : ok === false ? "✗" : "⚠"} ${name}${detail ? ` — ${detail}` : ""}`); return ok; };
const fail = msg => { check(false, msg); summary(); process.exit(1); };
const secs = t => `${((Date.now() - t) / 1000).toFixed(1)} s`;

function summary() {
  const bad = results.filter(r => r.ok === false).length, warn = results.filter(r => r.ok === null).length;
  say(`\n${bad ? `✗ ${bad} check(s) failed` : "✓ ready"}${warn ? `, ${warn} warning(s)` : ""}`);
  if (Object.keys(recommend).length) say(`Recommended in "${provider}" for ${model} (run-book.json, or run-book.local.json where this machine's settings live; per model as { "${model}": value }): ${JSON.stringify(recommend)}`);
  if (!bad && offline) say(`This machine is ready. Once the endpoint is free:  npm run preflight -- --model ${model} --quick`);
  else if (!bad) say(`Start a run with:  npm run auto -- --model ${model}`);
}

say(`Preflight for ${model}${offline ? " (offline: nothing is sent to the endpoint)" : ""}\n`);
// ---- 1. configuration
if (!provider) fail(`${model} isn't in run-book.json local.models, remote.models or openrouter.models (or an OpenRouter "vendor/model" id)`);
const s = endpointSettings(book, provider, model);
check(true, `run-book: ${provider}`, `context ${s.contextLength}, thinking ${s.thinking ? "on" : "off"}, rewrite ${s.rewrite ? "on" : "off"}, usage fix ${s.usageFix ? "on" : "off"}${s.dropFields.length ? `, dropping ${s.dropFields.join(", ")}` : ""}, loop guard ${s.guard.loopLimit}, max tokens ${s.guard.maxTokens ?? "none"}, max $ ${s.guard.maxUsd ?? "none"}, timeout ${s.timeoutMinutes ?? book.options?.timeoutMinutes ?? 90} min`);
if (!s.guard.price) check(null, "no price under pricing." + provider + "." + model, "the run can't be scored for cost, and maxUsd can't apply (maxTokens still does)");
let upstream = null, upstreamPort = null, apiKey = null;
if (REMOTE_LIKE.includes(provider)) {
  if (!s.baseUrl) fail(`no base URL: set ${provider}.baseUrl`);
  apiKey = endpointApiKey(s);
  if (!apiKey) fail(`no API key: set the ${s.apiKeyEnv} environment variable (e.g. $env:${s.apiKeyEnv} = "…" in this PowerShell)`);
  check(true, `endpoint ${s.baseUrl}, key from ${endpointKeySource(s)}`, `${apiKey.length} characters`);
  upstream = s.baseUrl;
} else if (offline) {
  check(!!resolveLms(), "LM Studio's lms CLI", resolveLms() ?? "not installed");
} else {
  const lms = resolveLms();
  if (!lms) fail("LM Studio's lms CLI isn't installed");
  upstreamPort = ensureServer(lms);
  const t = Date.now();
  loadModel(lms, { key: s.lmstudioKey, identifier: model, contextLength: s.contextLength });
  check(true, `LM Studio on port ${upstreamPort}, ${s.lmstudioKey} loaded`, secs(t));
}
let BIN = null;
try { BIN = resolveClaudeBin(args.claude); } catch (e) { check(false, "Claude CLI", e.message); }
if (BIN) {
  const a = authStatus(BIN);
  check(a.loggedIn ? true : null, "Claude CLI logged in (needed for grading with Opus)", a.loggedIn ? a.authMethod : "not logged in: run with --no-grade, or log in");
}

// ---- 2–6. the endpoint (skipped with --offline)
if (!offline && upstream) {
  // can this machine reach it at all? (an unreachable LAN box otherwise hangs until the proxy's 15-minute timeout)
  const u = new URL(upstream);
  const port = Number(u.port) || (u.protocol === "https:" ? 443 : 80);
  const reach = await new Promise(res => {
    const sock = net.connect({ host: u.hostname, port, timeout: 8000 });
    sock.on("connect", () => { sock.destroy(); res(null); });
    sock.on("timeout", () => { sock.destroy(); res("no answer in 8 s"); });
    sock.on("error", e => res(e.code || e.message));
  });
  if (reach) {
    const mine = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === "IPv4" && !i.internal).map(i => i.address).join(", ");
    fail(`can't reach ${u.hostname}:${port} (${reach}); this machine is on ${mine || "no network"}: same network as the endpoint? VPN?`);
  }
}
if (!offline) {
  // through the proxy, with the run-book's settings
  const proxy = await startProxy({ upstream, upstreamPort, apiKey, thinking: s.thinking, rewrite: s.rewrite, usageFix: s.usageFix, dropFields: s.dropFields, extraBody: s.extraBody, guard: { loopLimit: 0 } });
  // a raw proxy (no rewrite, no usage fix) to see what the endpoint itself does
  const raw = await startProxy({ upstream, upstreamPort, apiKey, rewrite: false, usageFix: false, extraBody: s.extraBody, guard: { loopLimit: 0 } });
  const call = async (p, body) => {
    const t = Date.now();
    const r = await fetch(`http://127.0.0.1:${p.port}/v1/messages`, { method: "POST", headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 2000, ...body }) });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text, ms: Date.now() - t };
  };
  const errorOf = r => r.json?.error?.message || r.text.slice(0, 300);

  // what the server says it serves: the exact model id, and (vLLM) the context length it was started with, which
  // Claude Code must compact below or requests start failing late in the run
  try {
    const res = await fetch(`http://127.0.0.1:${proxy.port}/v1/models`, { headers: { "anthropic-version": "2023-06-01" }, signal: AbortSignal.timeout(30_000) });
    const list = res.ok ? (await res.json())?.data ?? [] : null;
    if (!list) check(null, "served models", `/v1/models answered HTTP ${res.status}; can't confirm the model id or context length`);
    else {
      const mine = list.find(m => m.id === model);
      // OpenRouter lists hundreds of models (with context_length and a price); a vLLM server lists its one or two
      const ids = list.length > 20 ? `${list.length} models, e.g. ${list.filter(m => m.id.split("/")[0] === model.split("/")[0]).slice(0, 8).map(m => m.id).join(", ") || list.slice(0, 8).map(m => m.id).join(", ")}` : list.map(m => m.id).join(", ") || "none";
      const ctxOf = m => m?.max_model_len || m?.context_length || m?.top_provider?.context_length || 0;
      const priceOf = m => m?.pricing?.prompt ? `, $${(m.pricing.prompt * 1e6).toFixed(2)} in / $${(m.pricing.completion * 1e6).toFixed(2)} out / $${(Number(m.pricing.input_cache_read || m.pricing.prompt) * 1e6).toFixed(2)} cache read per M` : "";
      check(mine ? true : null, "served models", mine ? `${model}${ctxOf(mine) ? `, context ${ctxOf(mine)}` : ""}${priceOf(mine)}` : `${model} isn't listed; the server has: ${ids}`);
      if (!mine && list.length === 1) recommend.models = [list[0].id];
      if (mine && !s.guard.price && mine.pricing?.prompt) recommend.price = { input: +(mine.pricing.prompt * 1e6).toFixed(4), output: +(mine.pricing.completion * 1e6).toFixed(4), cacheRead: +(Number(mine.pricing.input_cache_read || mine.pricing.prompt) * 1e6).toFixed(4), note: `goes under pricing.${provider}` };
      const max = Number(ctxOf(mine) || (list.length === 1 ? ctxOf(list[0]) : 0));
      if (max && max < s.contextLength) {
        check(false, "context length", `the server allows ${max} tokens, the run-book says ${s.contextLength}: Claude Code would overflow before compacting`);
        recommend.contextLength = max;
      } else if (max) check(true, "context length", `server ${max} ≥ run-book ${s.contextLength}${max >= 2 * s.contextLength ? ` (contextLength could go up to ${max})` : ""}`);
    }
  } catch (e) { check(null, "served models", `/v1/models: ${e.message}`); }

  let r = await call(proxy, { messages: [{ role: "user", content: "Reply with the single word OK." }] });
  if (r.status !== 200) { await proxy.close(); await raw.close(); fail(`endpoint answers — HTTP ${r.status}: ${errorOf(r)}`); }
  check(true, "endpoint answers", `${r.ms} ms, model says "${(r.json.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim().slice(0, 40)}"`);

  // a rough speed: one ~500-token answer (without thinking, so it's all visible output)
  const sp = await call(raw, { max_tokens: 600, messages: [{ role: "user", content: "Write the numbers from 1 to 150 as English words, separated by commas. Nothing else." }] });
  const outTok = Number(sp.json?.usage?.output_tokens || 0);
  if (sp.status === 200 && outTok) check(true, "speed", `${outTok} output tokens in ${(sp.ms / 1000).toFixed(1)} s ≈ ${(outTok / (sp.ms / 1000)).toFixed(0)} tokens/s (incl. time to first token)`);
  else check(null, "speed", sp.status === 200 ? "no output token count reported" : errorOf(sp));

  r = await call(proxy, { tools: [{ name: "get_weather", description: "Get the weather for a city", input_schema: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } }],
    messages: [{ role: "user", content: "What's the weather in Copenhagen? Use the tool." }] });
  const tu = (r.json?.content || []).find(b => b.type === "tool_use");
  check(r.status === 200 && tu?.name === "get_weather" && /copenhagen/i.test(JSON.stringify(tu.input)), "tool call", r.status === 200 ? (tu ? `${tu.name}(${JSON.stringify(tu.input)}), ${r.ms} ms` : `no tool_use; stop_reason ${r.json?.stop_reason}`) : errorOf(r));

  // usage: the same ~4k-token prompt twice; the second time some of it should be cached
  const long = "You are a careful assistant. " + "Umbraco is a CMS built on .NET. ".repeat(450);
  const u1 = await call(raw, { system: long, messages: [{ role: "user", content: "Say hi." }] });
  const u2 = await call(raw, { system: long, messages: [{ role: "user", content: "Say hi." }] });
  const usage = u2.json?.usage || {};
  if (u2.status !== 200) check(false, "usage counting", errorOf(u2));
  else if (!usage.cache_read_input_tokens) check(null, "usage counting", `no cache reads reported (input ${usage.input_tokens}); Claude Code's context estimate should still be right`);
  else if (Number(usage.input_tokens) >= Number(usage.cache_read_input_tokens)) {
    check(s.usageFix ? true : false, "usage counting", `input_tokens ${usage.input_tokens} includes the cached ${usage.cache_read_input_tokens}: Claude Code would count the context twice and compact at half the window${s.usageFix ? "; the run-book's fixUsage corrects it" : ""}`);
    if (!s.usageFix) recommend.fixUsage = true;
  } else check(true, "usage counting", `input ${usage.input_tokens} + cached ${usage.cache_read_input_tokens}: Anthropic semantics`);

  // a role:"system" message mid-conversation, as Claude Code sends the environment
  const sys = await call(raw, { system: "You are helpful.", messages: [{ role: "user", content: "Hi." }, { role: "system", content: "The time is 12:00." }, { role: "assistant", content: "Hello." }, { role: "user", content: "Reply with OK." }] });
  if (sys.status === 200) check(true, "mid-conversation system messages accepted");
  else {
    check(s.rewrite ? true : false, "mid-conversation system messages", `the endpoint refuses them (HTTP ${sys.status}: ${errorOf(sys).slice(0, 120)})${s.rewrite ? "; the run-book's rewrite handles it" : ""}`);
    if (!s.rewrite) recommend.rewrite = true;
  }

  // thinking: on a small question, with Claude Code's request; and whether dropping it switches thinking off
  const q = { messages: [{ role: "user", content: "Is 391 prime? Answer in one word." }] };
  const th = await call(raw, { ...q, thinking: { type: "adaptive" } });
  const noth = await call(raw, q);
  const thinkLen = (th.json?.content || []).filter(b => b.type === "thinking").reduce((n, b) => n + (b.thinking || "").length, 0);
  if (th.status !== 200) check(null, "thinking", `the endpoint refuses Claude Code's thinking request (HTTP ${th.status}: ${errorOf(th).slice(0, 120)}); set thinking: false`);
  else check(true, "thinking", `with thinking: ${th.json?.usage?.output_tokens ?? "?"} output tokens, ${thinkLen} characters of thinking, ${th.ms} ms; without: ${noth.json?.usage?.output_tokens ?? "?"} tokens, ${noth.ms} ms${s.thinking ? "" : " (the run-book has thinking off)"}`);
  await raw.close();

  // ---- 6. Claude Code end to end, on a tiny task in a temp folder
  if (BIN) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-preflight-"));
    fs.writeFileSync(path.join(dir, "fruit.txt"), "apples 3\npears 5\nplums 2\n");
    const env = { ...cleanEnv(), ...endpointSessionEnv({ proxyPort: proxy.port, identifier: model, contextLength: s.contextLength, maxOutputTokens: s.maxOutputTokens }) };
    const t = Date.now();
    const out = await new Promise(res => {
      const c = spawn(BIN, ["-p", "Read fruit.txt, add up the fruit counts, and write the total to total.txt. Then say done.", "--model", model,
        "--permission-mode", "bypassPermissions", "--setting-sources", "project", "--output-format", "json"], { cwd: dir, env, windowsHide: true });
      let o = ""; c.stdout.on("data", d => o += d); c.stderr.on("data", d => o += d);
      const timer = setTimeout(() => c.kill(), 10 * 60_000);
      c.on("exit", () => { clearTimeout(timer); res(o); });
    });
    let j = null; try { j = JSON.parse(out.trim().split("\n").pop()); } catch {}
    const total = fs.existsSync(path.join(dir, "total.txt")) ? fs.readFileSync(path.join(dir, "total.txt"), "utf8").trim() : null;
    check(j && !j.is_error && total === "10", "Claude Code end to end", j ? `${j.num_turns} turns, ${secs(t)}, total.txt = ${total ?? "(missing)"}${total === "20" ? " (it added the Read tool's line numbers)" : ""}${j.is_error ? `, error: ${String(j.result).slice(0, 200)}` : ""}` : out.slice(0, 300));
    fs.rmSync(dir, { recursive: true, force: true });
  }
  await proxy.close();
}

// ---- 7. the benchmark itself
if (!args.quick) {
  check(hasBaseline(), "baseline repo", hasBaseline() ? "bench/.baseline-git" : `missing: run "npm run baseline" once on the pristine scaffold`);
  const ch = changes();
  const dirty = [...ch.added, ...ch.modified, ...ch.deleted].filter(f => f !== ".mcp.json");
  check(dirty.length === 0, "Umbraco.Bench is pristine", dirty.length ? `${dirty.length} changed file(s): npm run reset -- --force` : "");
  const node = process.execPath;
  const t = Date.now();
  const up = spawnSync(node, [path.join(ROOT, "bench", "up.mjs")], { cwd: ROOT, encoding: "utf8" });
  if (check(up.status === 0, "Umbraco boots", up.status === 0 ? secs(t) : (up.stderr || up.stdout).slice(-300))) {
    const tools = await mcpTools();
    check(tools.count > 0, "Umbraco MCP server lists its tools", tools.count ? `${tools.count} tools, ~${Math.round(tools.chars / 3.5 / 1000)}k tokens of definitions on every request (Claude Code loads MCP tools up front for non-Anthropic endpoints)` : tools.error);
    spawnSync(node, [path.join(ROOT, "bench", "down.mjs")], { cwd: ROOT, encoding: "utf8" });
  }
  // the boot writes a database and uSync's first export: put the scaffold back if it was pristine before
  if (!dirty.length) {
    const ref = `preflight-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
    const r = spawnSync(node, [path.join(ROOT, "bench", "reset.mjs"), "--force", "--as", ref], { cwd: ROOT, encoding: "utf8" });
    check(r.status === 0 ? true : null, "Umbraco.Bench reset after the boot", r.status === 0 ? `pristine again (the boot's files archived as refs/runs/${ref})` : `npm run reset -- --force: ${(r.stderr || r.stdout).slice(-200)}`);
  }
}
summary();

// The test's MCP server, started the way .mcp.json says, asked for its tool list over stdio
function mcpTools() {
  const cfg = JSON.parse(fs.readFileSync(path.join(PROJECT, ".mcp.json"), "utf8")).mcpServers?.umbraco;
  if (!cfg) return { count: 0, error: "no umbraco server in .mcp.json" };
  const env = { ...cleanEnv() };
  for (const [k, v] of Object.entries(cfg.env || {})) env[k] = String(v).replace(/\$\{(\w+)(?::-([^}]*))?\}/g, (_, n, d) => process.env[n] ?? d ?? "");
  const win = process.platform === "win32";
  const p = spawn(win ? "cmd.exe" : cfg.command, win ? ["/d", "/c", cfg.command, ...(cfg.args || [])] : cfg.args || [], { cwd: PROJECT, env, windowsHide: true });
  return new Promise(resolve => {
    let buf = "";
    const done = v => { clearTimeout(timer); p.kill(); resolve(v); };
    const timer = setTimeout(() => done({ count: 0, error: "no answer from the MCP server in 90 s" }), 90_000);
    const send = m => p.stdin.write(JSON.stringify(m) + "\n");
    p.stdout.on("data", d => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const l = buf.slice(0, i); buf = buf.slice(i + 1);
        let m; try { m = JSON.parse(l); } catch { continue; }
        if (m.id === 1) { send({ jsonrpc: "2.0", method: "notifications/initialized" }); send({ jsonrpc: "2.0", id: 2, method: "tools/list" }); }
        // what Claude Code sends per tool: name, description and input schema (not the output schema)
        if (m.id === 2) done({ count: m.result?.tools?.length ?? 0, chars: JSON.stringify((m.result?.tools ?? []).map(t => ({ name: `mcp__umbraco__${t.name}`, description: t.description, input_schema: t.inputSchema }))).length });
      }
    });
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "bench-preflight", version: "1" } } });
  });
}
