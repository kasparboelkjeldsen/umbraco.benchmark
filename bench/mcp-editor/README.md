# bench/mcp-editor

Umbraco's editor MCP server (`@umbraco-cms/mcp-editor`, pinned) for the MCP Guided test. `npm run setup -- mcp-guided` installs it here the first time, and `.mcp.json` runs it with `node` from `node_modules/`.

`patch.mjs` runs after every install. The MCP SDK client (1.32.1, the latest as of 2026-10-07) checks a tool's `structuredContent` against the tool's output schema even when the result is an error, despite its own comment ("not when there's an error"). The editor server calls the dev server through that client, so every error from Umbraco came back as `Structured content does not match the tool's output schema`, and Umbraco's own message was lost. For example, the patched server returns `The targeted content parent could not be found (ParentNotFound)` where the published one returned the schema error. The patch skips the check for error results, which is all it changes.
