// The benchmark tests: same goal (a block-grid blog with 2 posts), different ways of building schema + content.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, readJson, writeJson } from "./common.mjs";

// Umbraco's editor MCP server for the MCP Guided test, installed (and patched) in bench/mcp-editor on first setup
const EDITOR_MCP_DIR = path.join(ROOT, "bench", "mcp-editor");
const EDITOR_MCP_ENTRY = path.join(EDITOR_MCP_DIR, "node_modules", "@umbraco-cms", "mcp-editor", "dist", "index.js");
function ensureEditorMcp() {
  if (fs.existsSync(EDITOR_MCP_ENTRY)) {
    const r = spawnSync(process.execPath, [path.join(EDITOR_MCP_DIR, "patch.mjs")], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`bench/mcp-editor/patch.mjs failed: ${r.stderr || r.stdout}`);
    return;
  }
  console.log("Installing the editor MCP server into bench/mcp-editor (first time only) …");
  const r = spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: EDITOR_MCP_DIR, stdio: "inherit", shell: true });
  if (r.status !== 0 || !fs.existsSync(EDITOR_MCP_ENTRY)) throw new Error("npm install in bench/mcp-editor failed");
}

export const VARIANTS = {
  mcp: {
    name: "MCP",
    promptFile: "tests/mcp.md",
    hasPrompt1: true,
    mcpJson: "baseline", // the scaffold's own .mcp.json (Umbraco MCP server)
  },
  // the MCP test for small models: a shorter prompt ending in numbered steps, and a slim tool kit (44 tools, ~28k
  // tokens, vs the full test's 160 tools, ~77k): the dev server only for schema, media import and the domain, and
  // Umbraco's editor MCP server for pages, blocks and publishing (it builds block grid values itself). Same checks and rubric.
  "mcp-guided": {
    name: "MCP Guided",
    promptFile: "tests/mcp-guided.md",
    hasPrompt1: true,
    mcpJson: {
      mcpServers: {
        umbraco: {
          command: "npx",
          args: ["-y", "@umbraco-cms/mcp-dev@18"],
          env: {
            NODE_TLS_REJECT_UNAUTHORIZED: "0",
            UMBRACO_CLIENT_ID: "umbraco-back-office-mcp-local-only",
            UMBRACO_CLIENT_SECRET: "mcp-local-dev-secret-b3ll4b00t-not-a-real-secret",
            UMBRACO_BASE_URL: "${UMBRACO_MCP_URL:-https://localhost:44317}",
            UMBRACO_INCLUDE_TOOLS: [
              "get-all-document-types", "get-document-type-by-id", "get-document-type-root", "get-document-type-children",
              "create-document-type", "create-element-type", "update-document-type", "move-document-type",
              "get-all-data-types", "find-data-type", "get-data-type", "get-data-type-schema", "create-data-type", "update-data-type",
              "get-template-root", "get-template", "create-template", "update-template",
              "get-media-root", "get-media-children", "get-media-by-id", "create-media-folder", "create-media", "create-media-multiple",
              "get-document-domains", "put-document-domains",
            ].join(","),
            UMBRACO_ALLOWED_MEDIA_PATHS: "unsplash",
          },
        },
        // a local, pinned install with patch.mjs applied (bench/mcp-editor/README.md): the published beta hides
        // Umbraco's errors behind "Structured content does not match the tool's output schema"
        "umbraco-editor": {
          command: "node",
          args: [EDITOR_MCP_ENTRY.split(path.sep).join("/")],
          env: {
            NODE_TLS_REJECT_UNAUTHORIZED: "0",
            UMBRACO_CLIENT_ID: "umbraco-back-office-mcp-local-only",
            UMBRACO_CLIENT_SECRET: "mcp-local-dev-secret-b3ll4b00t-not-a-real-secret",
            UMBRACO_BASE_URL: "${UMBRACO_MCP_URL:-https://localhost:44317}",
            UMBRACO_INCLUDE_TOOLS: [
              "list-document-types", "get-document-type", "list-page-templates", "list-children", "search-content", "get-page",
              "inspect-blocks", "get-property-value-template", "create-page", "create-and-publish-page", "add-blockgrid-block",
              "add-rte-block", "edit-page", "edit-block", "delete-block", "set-page-template", "publish-page", "save-and-publish",
            ].join(","),
          },
        },
      },
    },
    channel: "mcp",
    prepare: ensureEditorMcp,
  },
  // MCP Guided with a cheat sheet of fixed ids and call shapes (for local models): same kit, checks and rubric, own table
  "mcp-guided-plus": { name: "MCP Guided+", promptFile: "tests/mcp-guided-plus.md", hasPrompt1: true, mcpJson: null, channel: "mcp", prepare: ensureEditorMcp },
  migrations: {
    name: "Migrations",
    promptFile: "tests/migrations.md",
    hasPrompt1: false,
    mcpJson: null, // no MCP server at all
  },
  playwright: {
    name: "Playwright",
    promptFile: "tests/playwright.md",
    hasPrompt1: true,
    mcpJson: {
      mcpServers: {
        playwright: {
          command: "npx",
          args: ["-y", "@playwright/mcp@0.0.83", "--browser", "msedge", "--isolated", "--ignore-https-errors"],
        },
      },
    },
  },
};

// The test whose checks and phases a test reuses (MCP Guided is the MCP test with another prompt)
export const channelOf = variant => VARIANTS[variant]?.channel ?? variant;

// Which test a blog prompt belongs to. Order matters: the MCP prompts mention migration plans (to forbid them).
export function detectVariant(prompt2) {
  if (/playwright/i.test(prompt2)) return "playwright";
  if (/^cheat sheet/im.test(prompt2)) return "mcp-guided-plus";
  if (/follow these steps in order/i.test(prompt2)) return "mcp-guided";
  if (/always use the (umbraco )?mcp server/i.test(prompt2)) return "mcp";
  if (/migration plan/i.test(prompt2)) return "migrations";
  return "mcp";
}

// The ```text block under "## Prompt 1" / "## Prompt 2" in tests/<test>.md: the prompts a human would paste
export function readPrompts(variant) {
  const md = fs.readFileSync(path.join(ROOT, VARIANTS[variant].promptFile), "utf8").replace(/\r\n/g, "\n");
  const block = n => {
    const section = md.split(/^## /m).find(s => s.startsWith(`Prompt ${n}`));
    return section?.match(/```text\n([\s\S]*?)\n```/)?.[1].trim() ?? null;
  };
  return { prompt1: block(1), prompt2: block(2) };
}

VARIANTS["mcp-guided-plus"].mcpJson = VARIANTS["mcp-guided"].mcpJson;

const STATE = path.join(ROOT, "bench", ".variant.json");
export const readVariantState = () => readJson(STATE, { variant: "mcp" });
export const writeVariantState = variant => writeJson(STATE, { variant, setAt: new Date().toISOString() });
export const clearVariantState = () => fs.rmSync(STATE, { force: true });
