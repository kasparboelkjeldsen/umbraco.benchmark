// The benchmark tests: same goal (a block-grid blog with 2 posts), different ways of building schema + content.
import fs from "node:fs";
import path from "node:path";
import { ROOT, readJson, writeJson } from "./common.mjs";

// The guided test's two Umbraco MCP servers, cut down to the tools a blog needs (44 tools, ~16k tokens of definitions,
// against 160 and ~37k for the MCP test): the dev server for schema, photo import (the Editor server only uploads from a
// URL or base64, not a local file) and the domain; Umbraco's Editor server (beta, pinned) for pages, blocks and
// publishing, where add-blockgrid-block writes the block grid JSON that small models kept getting wrong.
const UMBRACO_ENV = {
  NODE_TLS_REJECT_UNAUTHORIZED: "0",
  UMBRACO_CLIENT_ID: "umbraco-back-office-mcp-local-only",
  UMBRACO_CLIENT_SECRET: "mcp-local-dev-secret-b3ll4b00t-not-a-real-secret",
  UMBRACO_BASE_URL: "${UMBRACO_MCP_URL:-https://localhost:44317}",
};
const GUIDED_DEV_TOOLS = ["get-all-data-types", "find-data-type", "get-data-type", "create-data-type", "update-data-type", "create-data-type-folder",
  "get-all-document-types", "get-document-type-root", "get-document-type-children", "get-document-type-by-id", "create-document-type",
  "create-element-type", "update-document-type", "create-document-type-folder", "get-template-root", "get-template", "create-template",
  "update-template", "get-media-root", "get-media-children", "create-media-folder", "create-media", "create-media-multiple", "get-media-urls",
  "get-document-domains", "put-document-domains"];
const GUIDED_EDITOR_TOOLS = ["search-content", "get-page", "list-children", "list-document-types", "get-document-type", "inspect-blocks",
  "list-page-templates", "create-page", "create-and-publish-page", "add-blockgrid-block", "edit-page", "edit-block", "delete-block",
  "set-page-template", "publish-page", "save-and-publish", "get-publish-status", "search-media"];

export const VARIANTS = {
  mcp: {
    name: "MCP",
    promptFile: "tests/mcp.md",
    hasPrompt1: true,
    mcpJson: "baseline", // the scaffold's own .mcp.json (Umbraco MCP server)
  },
  // the MCP test for small models: a shorter prompt ending in numbered steps; same channel, checks and rubric
  "mcp-guided": {
    name: "MCP Guided",
    promptFile: "tests/mcp-guided.md",
    hasPrompt1: true,
    mcpJson: "baseline",
    channel: "mcp",
  },
  migrations: {
    name: "Migrations",
    promptFile: "tests/migrations.md",
    hasPrompt1: false,
    mcpJson: null, // no MCP server at all
  },
  // the MCP test made kinder still: a trimmed dev server plus Umbraco's Editor server, and a step-by-step prompt
  guided: {
    name: "MCP guided (Editor)",
    promptFile: "tests/guided.md",
    hasPrompt1: true,
    channel: "mcp",
    servers: ["umbraco", "umbraco-editor"], // both must be connected before the build prompt goes out
    mcpJson: {
      mcpServers: {
        umbraco: { command: "npx", args: ["-y", "@umbraco-cms/mcp-dev@18"],
          env: { ...UMBRACO_ENV, UMBRACO_ALLOWED_MEDIA_PATHS: "unsplash", UMBRACO_INCLUDE_TOOLS: GUIDED_DEV_TOOLS.join(",") } },
        "umbraco-editor": { command: "npx", args: ["-y", "@umbraco-cms/mcp-editor@18.0.0-beta.8"],
          env: { ...UMBRACO_ENV, UMBRACO_INCLUDE_TOOLS: GUIDED_EDITOR_TOOLS.join(",") } },
      },
    },
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
  if (/umbraco-editor/i.test(prompt2)) return "guided";
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

const STATE = path.join(ROOT, "bench", ".variant.json");
export const readVariantState = () => readJson(STATE, { variant: "mcp" });
export const writeVariantState = variant => writeJson(STATE, { variant, setAt: new Date().toISOString() });
export const clearVariantState = () => fs.rmSync(STATE, { force: true });
