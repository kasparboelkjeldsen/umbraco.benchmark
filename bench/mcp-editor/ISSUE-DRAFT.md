# Issue draft: umbraco/Umbraco-CMS-MCP-Editor

**Title:** Every Umbraco error from a chained dev-MCP call reaches the model as "Structured content does not match the tool's output schema"

---

### What happens

When an editor tool fails because Umbraco rejects the request (wrong parent, document type not allowed under the parent, bad property value, …), the model never sees Umbraco's error. It gets this instead:

```json
{"type":"Error","title":"McpError","detail":"MCP error -32602: Structured content does not match the tool's output schema: data must have required property 'message', data must have required property 'id', data must NOT have additional properties, …","status":500}
```

That is the schema of the *success* result, so the error reads as a bug in the tool, not as something the caller can fix. In practice, models retry the same call, then give up on the editor server and look for side doors (one of ours tried the Management API with a hand-made token).

### Reproduce

`@umbraco-cms/mcp-editor@18.0.0-beta.8` (with `@umbraco-cms/mcp-dev@18.1.7`, `@umbraco-cms/mcp-server-sdk@1.0.0-beta.42`, `@modelcontextprotocol/sdk@1.32.1`), Umbraco 18.2.0, Node 24.

Call `create-page` with a `parentId` that doesn't exist, or with a document type that isn't allowed under the parent:

```json
{ "name": "Nope", "documentTypeId": "<any document type id>", "parentId": "0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4e1" }
```

- **Expected:** Umbraco's problem details, e.g. `{"type":"Error","title":"The targeted content parent could not be found","status":404,"operationStatus":"ParentNotFound"}`.
- **Actual:** the `Structured content does not match the tool's output schema` error above.

`add-blockgrid-block` with an invalid value (e.g. a media picker entry whose `key` isn't a GUID) does the same.

### Cause

The chained call goes through `McpServerChain`'s `callTool` in `@umbraco-cms/mcp-server-sdk` (`dist/index.js`, `this.client.callTool({ name, arguments: args })`), i.e. the v1.x MCP SDK `Client.callTool`. When the dev server returns `isError: true` with the problem details as `structuredContent`, the v1.x client still validates that `structuredContent` against the tool's `outputSchema` and throws `McpError -32602`, so the problem details are lost before the editor tool can read them. Only clients that have called `tools/list` have the validators cached, which the chain does.

This is a known v1.x behaviour, and upstream has decided to keep it: modelcontextprotocol/typescript-sdk#2748, where #2836 fixes only the misleading comment ("Only validate structured content if present (not when there's an error)") and the earlier fix, #1945, was closed. The v2 client (`@modelcontextprotocol/client@2.x`) skips validation for error results. So the fix has to be on the Umbraco side.

### Possible fixes

1. In `@umbraco-cms/mcp-server-sdk`'s chain client, call `tools/call` without output validation, e.g. `this.client.request({ method: "tools/call", params: { name, arguments: args } }, CallToolResultSchema)`, and let the editor tool handle `isError` results itself.
2. Or move the chain client to the v2 client.
3. Or have `@umbraco-cms/mcp-dev` omit `structuredContent` on error results (problem details in `content` only). That fixes every v1.x client, not just the editor's chain.

### Workaround

A local patch of the v1.x client (`if (result.structuredContent && !result.isError)`), applied to the copies under `node_modules/@modelcontextprotocol/sdk/dist/*/client/`, gives the real errors back. We used it in a benchmark of small models driving Umbraco through the editor server. Without it, Haiku 4.5 spent minutes retrying masked errors and then tried the Management API; with it, the same model read the real errors, fixed its inputs and built its content through the editor server.
