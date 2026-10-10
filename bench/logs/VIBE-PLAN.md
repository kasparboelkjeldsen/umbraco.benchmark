# Mistral Vibe as a third harness: plan (2026-10-10, not built)

Why: the Mistral, GLM and DeepSeek runs all happened inside Claude Code, whose system prompt and tools are tuned for Claude. Vibe is Mistral's own agent (open source, Apache-2.0). Running the same tests in it tells us how much of the gap comes from the harness.

## What Vibe offers, from its README and docs.mistral.ai (not verified on this machine)

- **Install:** `uv tool install mistral-vibe`. UNIX is the officially supported target; Windows works.
- **Headless mode:**
  - `vibe -p` / `--prompt-file`, with `--output streaming` (NDJSON per message) or `json`, and `--output-dir DIR` (writes `export.json`: steps, token usage, cost, stop reason, plus a copy of the session journal).
  - `--auto-approve`, `--enabled-tools` / `--disabled-tools`.
  - Limits: `--max-turns`, `--max-price`, `--max-tokens`, `--time-limit`. These replace our proxy's guards, since Vibe speaks the OpenAI API and our proxy speaks Anthropic's. There's no loop guard.
  - Exit codes: 0 finished, 2 infra failure, 3 limit or refusal.
- **Continuing a session:** `--resume SESSION_ID` continues a finished run. That needs `log_interactions = true`.
- **Isolation:** `VIBE_HOME` moves everything (config.toml, .env, logs), so the runner can use a bench-owned home. Set `enable_telemetry`, `enable_update_checks` and `enable_notifications` to false.
- **Providers:**
  - `[[providers]]` takes `name`, `api_base`, `api_key_env_var`, `api_style = "openai"` and `backend = "generic"`, so OpenRouter works with the same key we already use.
  - `[[models]]` takes `name`, `provider`, `alias`, `input_price`, `output_price`, `cached_input_price`, `thinking`, `max_context_length` and `auto_compact_threshold`.
  - `active_model` picks the model.
- **MCP:**
  - `[[mcp_servers]]` takes `name`, `transport = "stdio"`, `command`, `args`, `env`, `startup_timeout_sec` (default 10) and `tool_timeout_sec` (default 60).
  - Tools are named `{server}_{tool}`, so for example `umbraco_get-page`. transcript.mjs must map these to `mcp__umbraco__get-page`.
  - The Umbraco servers can be slow to start: set `startup_timeout_sec` to 60.
- **ACP:** `vibe-acp` is an Agent Client Protocol server (JSON-RPC over stdio, used by Zed): one long-lived process, like `codex app-server`.

## The one real design risk

Our tests send prompt 1 with Umbraco running, then stop Umbraco, then send prompt 2. With `vibe -p` and then `--resume`, prompt 2 starts a new process, and its MCP servers start while Umbraco is down. Codex had exactly this problem with `exec resume`: the tools never appeared. Options:

1. **`vibe-acp`**, one process for both prompts, like the Codex app-server driver. Best fidelity, but there are unknowns: whether it reads `[[mcp_servers]]` from config.toml or only the servers the client sends at session start.
2. **`--resume`, first checking whether the Umbraco MCP servers list their tools with the site down.** If they do, they can connect on the first call after the model starts Umbraco, and this is the simple path.
3. **Fallback:** drop prompt 1 for Vibe runs. It only verifies the connection, and its time isn't scored. This changes the protocol slightly, so it would need noting.

## Build (about the size of the Codex driver)

- bench/lib/vibe.mjs:
  - writes `$VIBE_HOME/config.toml` from run-book `vibe` (provider, models, prices, limits) plus .mcp.json translated into `[[mcp_servers]]`
  - spawns the run and streams NDJSON to the console like the other drivers
  - collects `export.json` and the session journal
- A third transcript parser in transcript.mjs: Vibe steps → the normalized session (tool calls, results, errors, timings, tokens, cost). Map MCP tool names, and make sure the phase markers (schema write / content write) still fire.
- auto.mjs: provider `vibe` (`--model vibe:<alias>`). The gate needs a successful `umbraco_*` call or connected servers. Set the airgap env the same way.
- Pricing: take cost from Vibe's export, and cross-check it against tokens at OpenRouter's prices.
- exam-prompt.md: say that Vibe transcripts use `{server}_{tool}` names.

## The experiment worth running

A 2×2, so the harness effect is measured rather than assumed:

| | Claude Code | Vibe |
|---|---|---|
| Mistral (Devstral 2 or Large 4) | have it | new |
| Sonnet 5.5 (through OpenRouter in Vibe) | have it | new |

If Mistral improves in Vibe and Sonnet drops, the harness matters, and the post should say so. If neither moves, the gap is the models. Two runs per cell on the plain MCP test would come to about $10 at OpenRouter prices, most of it Sonnet.
