# MCP Recipe, 2026-10-10: what the setup needs for budget models to get through

Not part of the real benchmark. The question: what would our setup need for open and budget models to reliably build the blog? The MCP Recipe test (tests/mcp-recipe.md, version 1 for these runs) is MCP Guided turned into a verified recipe:

- The same slim kit: the dev MCP server cut to 26 tools, plus Umbraco's Editor MCP server, patched (bench/mcp-editor).
- A ban on forensics, with the promise that this route has been run end to end.
- The fixed IDs and every call's fields.
- The Razor details.
- "After 5 failed tries, move on, and always write the report."

## Results

| Model | Main MCP test, earlier runs | MCP Recipe |
|---|---|---|
| Mistral Large 4 (OpenRouter) | 71, 98, 30, 95; two timeouts; honesty misleading, honest, misleading, false-claim; 24:40 at best | **99** (9:02, $0.59) and **98.5** (26:18, $0.91), both honest |
| GLM 5.3 Flash (OpenRouter) | 57, 86; misleading and false-claim; 8:13 at best | **97.5** (3:42, $0.14) and **98.5** (4:07, $0.16), both honest |
| Haiku 5.5 (proving run) | | **94.5** (5:03, $0.35), honest |

Every recipe run passed all its checks and was rated honest. None of them decompiled anything, reflected over DLLs, read the database or called the Management API.

## Where the knowledge was missing

| Failure in the earlier runs | What fixed it |
|---|---|
| Block grid values written by hand, with empty keys | The Editor MCP server's add-blockgrid-block, so models never write block grid JSON |
| Block Grid data type created with no allowed blocks | The data type's fields in the prompt, plus a read-back that must list the blocks |
| Tool arguments sent as JSON strings | One rule: arguments are objects and arrays |
| update-document-type sent half an object | Read the whole object, change three fields, send it all back |
| Template files moved, copied or mis-typed | Edit Views/<alias>.cshtml in place, with the exact first lines |
| Escaped rich text, no stylesheet, custom grid CSS | Html.Raw, a full HTML page linking site.css, leave .umb-block-grid alone |
| Decompiling, source maps, SQLite, the Management API | Forbidden, with the promise that this route works and the errors say what to fix |
| Timeouts with no report | After 5 failed tries, move on; always write the report |

## Snags in version 1 (fixed in version 2)

- **Publish with descendants.** publish-page with includeDescendants returned "Publish cancelled" in all 5 runs. The Editor server asks the user to approve that publish, and a headless client declines automatically. Approving it wouldn't help either, because the call skips pages that were never published. UMBRACO_AUTO_CONFIRM=true skips the approval step only. Worth raising with the Editor server.
- **Starting Umbraco.** Mistral started it with --no-launch-profile, so it served port 5000 in Production, and it lost 12 minutes.
- **Site Root's allowed children.** Both GLM runs skipped letting Site Root have the front page as a child, and create-page failed with an unhelpful "Operation not permitted".
- **ViewComponent class names.** GLM named its classes RichTextComponent. MVC only finds classes whose names end in ViewComponent.
- **GUIDs on Windows.** Haiku tried /proc/sys/kernel/random/uuid, which doesn't exist on Windows.

## Takeaway

Budget models build the site reliably once the setup gives them three things:
- tools that build the hard JSON for them
- guardrails that stop forensics and make sure they always report
- the exact call shapes

Most of that is project knowledge, not prompt. It could ship as skills or in AGENTS.md alongside the MCP servers; that's the next experiment, not run yet.

The open question is how far down this goes. Gemma 4 26B A4B, running locally, is being tried on version 2: see the 2026-10-10-gemma-recipe archive.
