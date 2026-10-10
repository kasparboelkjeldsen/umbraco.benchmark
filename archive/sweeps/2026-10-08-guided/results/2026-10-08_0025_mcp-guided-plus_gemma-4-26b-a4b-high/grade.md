# Grade: 2026-10-08_0025_mcp-guided-plus_gemma-4-26b-a4b-high

**Test:** MCP Guided+ · **Model:** Gemma 4 26B A4B (high) · **Grader:** Opus 5.5 (low)

## Score: 12 / 100

| Category | Score | Max |
|---|---:|---:|
| It works | 0 | 35 |
| Content modeling | 6 | 25 |
| Code architecture & conventions | 4 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 2 | 5 |
| **Total** | **12** | **100** |

## Summary

Gemma 4 26B A4B got only partway through schema modeling (3 block element types, a Block Grid data type and a front page type with garbled property names) before the loop guard stopped it after 56 minutes. No post type, content, media, domain or Razor components exist, and the one template it wrote does not compile, so the site does not build.

## What it built

- **Element types (blocks):** `textBlock` (rich text `body`), `imageBlock` (media picker `image`), `spacerBlock` (integer `height`). The first two are in `Blocks`; `spacerBlock` was left at the root.
- **Data type:** `Blog Block Grid` (Custom/Umbraco.BlockGrid), 12 columns, allowing all three blocks at root.
- **Document types:** `blogFrontPage` in `Pages` (`title`, `bodyGrid`). No `blogPost` type: every attempt failed with DataTypeNotFound or malformed arguments.
- **Templates:** `blogFrontPageTemplate.cshtml`, created through MCP but not assigned to the type. It inherits `UmbracoViewPage<Umbraco.Cms.Web.Common.Models.PublishedContent>`, which does not exist, so the build fails.
- **Content, media, domain:** none.
- **Code:** no adapters, ViewComponents, view models or frontend build.

**Screenshots:** none. The build fails, so Umbraco can't boot and `npm run screenshot` reports that Umbraco isn't running. Grading is read-only, so the site was not fixed to take them.

## Issues

- **major**: `dotnet build` fails with CS0234 in `Umbraco.Bench.Umbraco/Views/blogFrontPageTemplate.cshtml`, so the site cannot boot.
- **major**: The benchmark loop guard stopped the run in step 3 after 4 identical malformed `create-element-type` calls (it tried to recreate blocks that already existed). Steps 4–12 never happened.
- **major**: No `blogPost` document type, pages, posts, media or domain exist.
- **major**: No block adapters (`Views/Partials/blockgrid/Components/`), ViewComponents or view models were written.
- **major**: No final report; the run ended on the guard's error message.
- **minor**: Property names contain leaked tool-call syntax (`blogFrontPage.bodyGrid` is named `Body Grid"}]}<tool_call|><|tool_call>call:…`, and the `imageBlock.image` and `spacerBlock.height` names are corrupted the same way).
- **minor**: `spacerBlock` is not in the Blocks folder. siteRoot and blogFrontPage have no allowed children, and blogFrontPage has no template assigned.
- **minor**: The frontend was never built (`wwwroot/dist/site.css` is missing).

## Strengths

- Used only the Umbraco MCP channel: no Management API, uSync, DB or migrations, and no access outside the folder or to memory.
- The Block Grid data type is correct and filed under `Custom/`, with rich text, image and spacer blocks.
- The front page type is filed in `Pages` with the block grid as its body.
