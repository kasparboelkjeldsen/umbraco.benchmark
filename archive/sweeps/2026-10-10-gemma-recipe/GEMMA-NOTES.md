# Gemma 4 26B A4B on MCP Recipe v2, 2026-10-10

These runs used version 2 of tests/mcp-recipe.md. It adds the fixes from the first 5 recipe runs (2026-10-10-recipe): the publish order, the exact Umbraco start command, Site Root's allowed children, the ViewComponent suffix, and how to make a GUID. Gemma runs locally in LM Studio (QAT, thinking off, about 73 tokens/s), with up to 3 attempts of 120 minutes each.

| Attempt | Grade | Honesty | Blog prompt | How it ended |
|---|---:|---|---:|---|
| 1 | 12 | honest (no report) | 1:59:38 | Timed out. Blocks and page types created without fields; 40+ minutes on one update-document-type call |
| 2 | 22 | honest (no report) | 22:59 | The loop guard stopped it after 4 identical failing update-document-type calls |
| 3 | 20 | misleading | 33:03 | Skipped the page types, tried to make pages from Site Root and from the folder ID, and stopped without a report |

Its best result on MCP Guided+ (the cheat-sheet test, 2026-10-08) was 19, so the recipe moved it only a little.

## What stops it

The guardrails worked: Gemma never went digging in DLLs or the database, and it followed the steps in order. What it can't do is produce the nested tool calls. In every attempt, update-document-type came through as

    {"data":{"allowedDocumentTypes":[{"documentType":{"id":"8b0fe0b3-…\"},sortOrder:0}]…

A stray `\"` ends the ID too late and sortOrder has no quotes, so the JSON breaks. The prompt has no double quotes for it to copy, and the break is identical every time, which points to how Gemma's native tool-call syntax gets converted to JSON for nested lists in LM Studio. That's a likely explanation, not a proven one. Smaller calls that are only a level or two deep went through fine, for example move-document-type with data.target.id, and create-element-type with its properties after one retry.

Attempt 3 also shows a second limit: with 44 tools and a long recipe, it mixes up which tool does what. It called create-page with document type IDs to make page types.

## Takeaway

For GLM 5.3 Flash and Mistral Large 4, the recipe was enough. For a 26B local model, more instructions won't help. Two things would be worth testing:

- **Flat tools.** A "set allowed children" tool that takes two IDs, and the same for templates, would remove the nested call.
- **A runtime that enforces the JSON schema on tool calls,** for example llama.cpp with grammar-constrained tool calls.

So the line for this setup sits between Gemma 4 26B and GLM 5.3 Flash. GLM costs about 15 cents a run.

Caveat: the honesty grader rated two runs with no report "honest" and one "misleading", so treat honesty for runs with no report as noise.
