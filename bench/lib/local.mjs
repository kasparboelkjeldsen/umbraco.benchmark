// Non-Anthropic models through Claude Code: an Anthropic-compatible /v1/messages endpoint (LM Studio on this machine, or
// a remote API such as DeepSeek's), with a small in-process proxy in between that fixes what the endpoint or the model's
// chat template gets wrong, holds the API key, logs every request and stops runaway runs. Claude Code then runs exactly
// as for a Claude model, with ANTHROPIC_BASE_URL pointed at the proxy.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { spawnSync } from "node:child_process";

export function resolveLms() {
  const f = path.join(os.homedir(), ".lmstudio", "bin", process.platform === "win32" ? "lms.exe" : "lms");
  return fs.existsSync(f) ? f : null;
}

const lms = (bin, args, timeout = 600_000) => {
  const r = spawnSync(bin, args, { encoding: "utf8", timeout, windowsHide: true });
  return { status: r.status, out: `${r.stdout || ""}${r.stderr || ""}`.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "") };
};

// Starts the LM Studio server if it isn't running; returns its port
export function ensureServer(bin) {
  let r = lms(bin, ["server", "status"]);
  let m = r.out.match(/port\s+(\d+)/i);
  if (!m || /not running/i.test(r.out)) { r = lms(bin, ["server", "start"]); m = r.out.match(/port\s+(\d+)/i); }
  if (!m) throw new Error(`couldn't start the LM Studio server: ${r.out.trim()}`);
  return Number(m[1]);
}

// Loads the model under `identifier` with the given context length (unloading everything else first, so the GPU
// holds only this model). An already-loaded model with the same identifier and context is reused.
export function loadModel(bin, { key, identifier, contextLength }) {
  const ps = lms(bin, ["ps"]).out;
  const row = ps.split("\n").find(l => l.trim().startsWith(identifier + " "));
  if (row && row.includes(String(contextLength))) return { reused: true };
  lms(bin, ["unload", "--all"]);
  const r = lms(bin, ["load", key, "-c", String(contextLength), "--identifier", identifier, "-y"]);
  if (r.status !== 0 || !/loaded successfully/i.test(r.out)) throw new Error(`lms load ${key} failed: ${r.out.trim().slice(-500)}`);
  return { reused: false, info: (r.out.match(/loaded successfully[^\n]*/i) || [""])[0] };
}

export function unloadAll(bin) { lms(bin, ["unload", "--all"]); }

// Rewrites a Claude Code /v1/messages request for chat templates that allow one system message, at the start (Qwen's
// raises "System message must be at the beginning"):
// - `system` as an array of blocks → one string
// - role:"system" messages mid-conversation (Claude Code sends the environment and reminders that way) →
//   <system-reminder> text in the user turn; consecutive same-role messages merged, tool_result blocks first
// - with thinking: false, Claude Code's `thinking` request is dropped, so LM Studio runs the model without its reasoning
//   mode (Gemma 4 26B A4B thought for 32k tokens without ever calling a tool)
export function rewriteRequest(j, { thinking = true } = {}) {
  if (!thinking) delete j.thinking;
  if (Array.isArray(j.system)) j.system = j.system.map(b => (typeof b === "string" ? b : b.text || "")).filter(Boolean).join("\n\n");
  if (Array.isArray(j.messages)) {
    const blocks = c => (typeof c === "string" ? [{ type: "text", text: c }] : c || []);
    const out = [];
    for (const m of j.messages) {
      const msg = m.role === "system"
        ? { role: "user", content: [{ type: "text", text: `<system-reminder>\n${blocks(m.content).map(b => b.text || "").join("\n")}\n</system-reminder>` }] }
        : { ...m, content: blocks(m.content) };
      const prev = out.at(-1);
      if (prev && prev.role === msg.role) {
        const all = [...prev.content, ...msg.content];
        prev.content = [...all.filter(b => b.type === "tool_result"), ...all.filter(b => b.type !== "tool_result")];
      } else out.push(msg);
    }
    j.messages = out;
  }
  return j;
}

// LM Studio counts the cached prompt in input_tokens AND in cache_read_input_tokens; the Anthropic API counts it only in
// the latter. Claude Code adds the two up, so it saw twice the real context and auto-compacted at ~half the window (a
// 51k-token conversation was compacted as "106k"), throwing away the IDs and progress the model needed and sending it
// round in circles. Subtract the cached part so input_tokens means what it means on the Anthropic API.
export function fixUsage(u) {
  if (!u || typeof u !== "object") return u;
  const cached = Number(u.cache_read_input_tokens || 0);
  if (cached > 0 && Number(u.input_tokens) >= cached) u.input_tokens = Number(u.input_tokens) - cached;
  return u;
}

// One line per request, to tell the main conversation from Claude Code's side requests (summaries, titles, …) and to
// see when earlier history changes (microcompaction): `head` fingerprints the system prompt + first message, `prefix`
// the whole history but the last message, so a changed `prefix` on a longer conversation means old turns were rewritten.
const fingerprint = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };
function describeRequest(j, bytes) {
  const msgs = j.messages || [];
  const last = msgs.at(-1);
  const blocks = Array.isArray(last?.content) ? last.content : [];
  const text = blocks.filter(b => b.type === "text").map(b => b.text).join(" ").replace(/\s+/g, " ");
  return {
    at: new Date().toISOString(), messages: msgs.length, tools: j.tools?.length ?? 0, maxTokens: j.max_tokens, bytes,
    head: fingerprint(JSON.stringify([j.system, msgs[0]])), prefix: fingerprint(JSON.stringify(msgs.slice(0, -1))),
    last: `${last?.role}:${blocks.map(b => b.type).join("+")}`, text: text.slice(0, 120),
    clearedResults: msgs.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.filter(b => b.type === "tool_result" && /cleared|omitted|removed/i.test(JSON.stringify(b.content ?? "")) && JSON.stringify(b.content ?? "").length < 200).length : 0), 0),
  };
}

// The same failing tool call (same tool, same input) answered with an error `limit` times: the model is stuck (Gemma 4
// created the same block four times against "Duplicate alias"). Returns { call, count } for the worst one, or null.
export function findLoop(messages, limit) {
  const calls = new Map();
  const failures = new Map();
  for (const m of messages || []) for (const b of Array.isArray(m.content) ? m.content : []) {
    if (m.role === "assistant" && b.type === "tool_use") calls.set(b.id, `${b.name} ${JSON.stringify(b.input)}`);
    if (b.type === "tool_result" && b.is_error && calls.has(b.tool_use_id)) {
      const k = calls.get(b.tool_use_id);
      failures.set(k, (failures.get(k) || 0) + 1);
    }
  }
  let worst = null;
  for (const [call, count] of failures) if (count >= limit && (!worst || count > worst.count)) worst = { call, count };
  return worst;
}

// The proxy between Claude Code and an Anthropic-compatible endpoint (LM Studio on this machine, or a remote API).
// - forwards to `upstream` (http or https; a path prefix such as /anthropic is kept)
// - rewrite: one system message for strict chat templates (see rewriteRequest); thinking: false drops `thinking`
// - usageFix: input_tokens without the cached part (see fixUsage)
// - apiKey: the real key is added here, so Claude Code (and its transcript) only ever sees a placeholder
// - guard: stops the run when the model loops (loopLimit identical failing calls) or spends more than maxTokens / maxUsd
//   (price per million tokens: input, output, cacheRead, cacheWrite). A stopped run gets an error response, which ends
//   the turn; the runner collects and grades what was built. stats() says what happened; reset() starts a new run.
// - dropFields: top-level request fields deleted before forwarding (e.g. one a strict server rejects as unknown)
// - log: one JSON line per request (see describeRequest), with the error body when the endpoint refuses
// Resolves to { port, close(), stats(), reset() }.
export function startProxy({ upstream = null, upstreamPort = null, apiKey = null, port = 0, log = null, thinking = true, rewrite = true,
  usageFix = true, dropFields = [], guard = {} }) {
  const target = new URL(upstream || `http://127.0.0.1:${upstreamPort}`);
  const client = target.protocol === "https:" ? https : http;
  const basePath = target.pathname.replace(/\/$/, "");
  const { loopLimit = 4, maxTokens = null, maxUsd = null, price = null } = guard;
  let state;
  const reset = () => { state = { requests: 0, tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, usd: 0, stopped: null }; };
  reset();
  const refuse = (res, message) => {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message } }));
  };
  const account = u => {
    if (!u) return;
    const t = state.tokens;
    const n = k => Number(u[k] || 0);
    t.input += n("input_tokens"); t.output += n("output_tokens");
    t.cacheRead += n("cache_read_input_tokens"); t.cacheWrite += n("cache_creation_input_tokens");
    if (price) state.usd += (n("input_tokens") * (price.input || 0) + n("output_tokens") * (price.output || 0)
      + n("cache_read_input_tokens") * (price.cacheRead ?? price.input ?? 0) + n("cache_creation_input_tokens") * (price.cacheWrite ?? price.input ?? 0)) / 1e6;
    const total = t.input + t.output + t.cacheRead + t.cacheWrite;
    if (!state.stopped && maxTokens && total > maxTokens) state.stopped = `token budget: ${total} tokens > ${maxTokens}`;
    if (!state.stopped && maxUsd && state.usd > maxUsd) state.stopped = `cost budget: $${state.usd.toFixed(2)} > $${maxUsd}`;
  };

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      let body = Buffer.concat(chunks);
      let summary = null;
      const t0 = Date.now();
      const isMessages = req.method === "POST" && /\/v1\/messages(\?|$)/.test(req.url);
      if (isMessages && body.length) {
        let j = null;
        try { j = JSON.parse(body.toString("utf8")); } catch {}
        if (j) {
          if (state.stopped) return refuse(res, `Benchmark guard stopped this run (${state.stopped}). Stop working and write your final report now.`);
          const loop = loopLimit ? findLoop(j.messages, loopLimit) : null;
          if (loop) {
            state.stopped = `loop: ${loop.count}x the same failing call: ${loop.call.slice(0, 200)}`;
            return refuse(res, `Benchmark guard stopped this run (${state.stopped}).`);
          }
          if (rewrite) rewriteRequest(j, { thinking }); else if (!thinking) delete j.thinking;
          for (const f of dropFields) delete j[f];
          body = Buffer.from(JSON.stringify(j));
          state.requests++;
          if (log) summary = describeRequest(j, body.length);
        }
      }
      const headers = { ...req.headers, host: target.host, "content-length": body.length };
      if (apiKey) { headers.authorization = `Bearer ${apiKey}`; headers["x-api-key"] = apiKey; }
      const up = client.request({ protocol: target.protocol, hostname: target.hostname, port: target.port || undefined,
        path: basePath + req.url, method: req.method, headers }, r => {
        let usage = null, error = null;
        // after the body has been handled, so the usage it carried is known
        const done = () => {
          if (isMessages) account(usage);
          if (summary) log(JSON.stringify({ ...summary, status: r.statusCode, seconds: Math.round((Date.now() - t0) / 100) / 10, usage, ...(error ? { error } : {}) }));
        };
        if (!isMessages) { res.writeHead(r.statusCode, r.headers); r.on("end", done); r.pipe(res); return; }
        const out = { ...r.headers };
        delete out["content-length"];
        res.writeHead(r.statusCode, out);
        const fix = u => {
          if (!u) return;
          if (usageFix) fixUsage(u);
          usage = { ...(usage || {}), ...Object.fromEntries(Object.entries(u).filter(([, v]) => typeof v === "number")) };
        };
        if (/event-stream/i.test(r.headers["content-type"] || "")) {
          // SSE: usage arrives in message_start (input, cache) and message_delta (output), line by line
          let buf = "";
          const line = l => {
            if (!l.startsWith("data:")) return l;
            try { const ev = JSON.parse(l.slice(5).trim()); fix(ev.message?.usage); fix(ev.usage); return `data: ${JSON.stringify(ev)}`; } catch { return l; }
          };
          r.setEncoding("utf8");
          r.on("data", chunk => {
            buf += chunk;
            let nl;
            while ((nl = buf.indexOf("\n")) >= 0) { res.write(line(buf.slice(0, nl)) + "\n"); buf = buf.slice(nl + 1); }
          });
          r.on("end", () => { if (buf) res.write(line(buf)); res.end(); done(); });
        } else {
          const parts = [];
          r.on("data", c => parts.push(c));
          r.on("end", () => {
            let b = Buffer.concat(parts);
            if (r.statusCode >= 400) error = b.toString("utf8").slice(0, 1000);
            try { const j = JSON.parse(b.toString("utf8")); fix(j.usage); b = Buffer.from(JSON.stringify(j)); } catch {}
            res.end(b);
            done();
          });
        }
      });
      up.setTimeout(15 * 60_000, () => up.destroy(new Error("upstream timed out")));
      up.on("error", e => {
        if (res.headersSent) { res.end(); return; }
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ type: "error", error: { type: "api_error", message: `benchmark proxy: ${e.message}` } }));
      });
      up.end(body);
    });
  });
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve({
      port: server.address().port, close: () => new Promise(r => server.close(r)), reset,
      stats: () => ({ ...state, tokens: { ...state.tokens }, usd: Math.round(state.usd * 10000) / 10000 }),
    }));
  });
}

// The run-book's settings for an endpoint model (sections "local" and "remote"; a setting is one value or
// { "<model>": value }). Shared by the runner and npm run preflight so both talk to the endpoint the same way.
export function endpointSettings(book, provider, model) {
  const cfg = book[provider] || {};
  const pick = (k, fallback) => { const v = cfg[k]; return (v && typeof v === "object" && !Array.isArray(v) ? v[model] : v) ?? fallback; };
  return {
    provider, model,
    contextLength: Number(pick("contextLength", 131072)),
    thinking: pick("thinking", true) !== false,
    // LM Studio needs the request rewrites and the usage fix; a remote API is passed through unless the run-book says so
    rewrite: pick("rewrite", provider === "local") !== false,
    usageFix: pick("fixUsage", provider === "local") !== false,
    maxOutputTokens: Number(pick("maxOutputTokens", 16000)),
    guard: { loopLimit: Number(pick("loopLimit", 4)), maxTokens: pick("maxTokens", null), maxUsd: pick("maxUsd", null), price: book.pricing?.[provider]?.[model] ?? null },
    lmstudioKey: provider === "local" ? pick("lmstudioKeys", model) : null,
    baseUrl: provider === "remote" ? process.env.BENCH_REMOTE_URL || pick("baseUrl", null) : null,
    apiKeyEnv: provider === "remote" ? pick("apiKeyEnv", "BENCH_REMOTE_KEY") : null,
    // a literal key, only for endpoints that don't check one (a box on the LAN that wants "dummy"); it wins over
    // apiKeyEnv, so a real key in the environment is never sent to such a box
    apiKey: provider === "remote" ? pick("apiKey", null) : null,
    dropFields: [].concat(pick("dropFields", [])),
    timeoutMinutes: pick("timeoutMinutes", null),
  };
}

// The key for an endpoint: the run-book's literal apiKey, else the environment variable it names
export const endpointApiKey = s => s.apiKey ?? (s.apiKeyEnv ? process.env[s.apiKeyEnv] : null) ?? null;
export const endpointKeySource = s => (s.apiKey != null ? "the run-book's apiKey" : s.apiKeyEnv);

// The environment that points a Claude Code session at the proxy: every model alias (and subagents) → the endpoint's
// model, no claude.ai traffic, the real context window (so auto-compaction comes in time), a 16k cap per response (a
// stuck turn ends after minutes, not after Claude Code's default 32k tokens), and a long request timeout for slow models.
// The key Claude Code sees is a placeholder; the proxy adds the real one.
export function endpointSessionEnv({ proxyPort, identifier, contextLength, maxOutputTokens = 16000 }) {
  return {
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${proxyPort}`,
    ANTHROPIC_AUTH_TOKEN: "benchmark-proxy",
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_MODEL: identifier,
    ANTHROPIC_DEFAULT_OPUS_MODEL: identifier,
    ANTHROPIC_DEFAULT_SONNET_MODEL: identifier,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: identifier,
    ANTHROPIC_SMALL_FAST_MODEL: identifier,
    CLAUDE_CODE_SUBAGENT_MODEL: identifier,
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
    CLAUDE_CODE_AUTO_COMPACT_WINDOW: String(contextLength),
    CLAUDE_CODE_MAX_OUTPUT_TOKENS: String(maxOutputTokens),
    API_TIMEOUT_MS: "900000",
  };
}
export const localSessionEnv = endpointSessionEnv;
