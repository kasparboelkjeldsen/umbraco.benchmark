// The MCP SDK client (1.32.1, the latest) validates a tool's structuredContent against its output schema even when the
// result is an error, despite its own comment ("not when there's an error"). The editor MCP server calls the dev server
// through that client, so every Umbraco error (e.g. "document type not allowed here") reached the model as "Structured
// content does not match the tool's output schema", with Umbraco's real message lost. This skips the check for errors.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "node_modules");
const from = /\/\/ Only validate structured content if present \(not when there's an error\)\r?\n(\s*)if \(result\.structuredContent\) \{/g;
let patched = 0, already = 0;
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (/\/@modelcontextprotocol\/sdk\/dist\/.*client.*\.js$/.test(p.split(path.sep).join("/"))) {
    const s = fs.readFileSync(p, "utf8");
    if (s.includes("if (result.structuredContent && !result.isError) {")) { already++; continue; }
    const t = s.replace(from, (m, ind) => m.replace("if (result.structuredContent) {", "if (result.structuredContent && !result.isError) {"));
    if (t !== s) { fs.writeFileSync(p, t); patched++; }
  }
} };
walk(root);
console.log(`patch.mjs: patched ${patched} MCP SDK client file(s)${already ? `, ${already} already patched` : ""}`);
if (!patched && !already) { console.error("patch.mjs: found nothing to patch — has the SDK changed?"); process.exit(1); }
