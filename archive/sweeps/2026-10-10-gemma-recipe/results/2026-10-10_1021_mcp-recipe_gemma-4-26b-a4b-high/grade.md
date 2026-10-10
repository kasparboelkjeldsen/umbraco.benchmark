# Grade: 2026-10-10_1021_mcp-recipe_gemma-4-26b-a4b-high

Test **MCP Recipe**, model Gemma 4 26B A4B (high), graded by Opus 5.5 (low).

| Category | Score | Max |
|---|---:|---:|
| It works | 5 | 35 |
| Content modeling | 13 | 25 |
| Code architecture & conventions | 1 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 1 | 5 |
| **Total** | **20** | **100** |

## Summary

The model left a partial schema built over MCP: three block element types, a Blog Block Grid data type, and blog front page and post types with sensible metadata properties. Allowed children and templates are not wired up, there is no real content (only three junk draft nodes), and there is no media, domain or Razor, so `/` returns 404. The session ended after 35 minutes without a report.

## Issues

- **major**: `https://localhost:44317/` returns 404 "No template exists to render the document at URL /". No front page, posts, media or domain exist.
- **major**: No Razor was written. `Views/blogFrontPage.cshtml` and `Views/blogPost.cshtml` are the empty stubs that create-template generated, and there are no adapters, ViewComponents or view models.
- **major**: No document type has allowed children or assigned templates. `update-document-type` failed on garbled arguments, so `create-page` returned "Operation not permitted".
- **major**: There is no final report. The session ended with "I will attempt to start it again now" and disclosed none of the failures.
- **minor**: Three stray draft siteRoot nodes sit at the content root, one named with leaked tool-call tokens (`Blog Front Page Type"}<tool_call|>…`).
- **minor**: `quoteBlock` sits at the document-type root instead of the Blocks folder.

## What it built

- **Document types**:
  - `blogFrontPage` (Pages): title, intro, body
  - `blogPost` (Pages): title, publishDate, excerpt, listingImage, body
  - `richTextBlock` and `imageBlock` (Blocks)
  - `quoteBlock` (left at the root)
  - None has allowed children or templates.
- **Data types**: `Blog Block Grid` in `Custom/Umbraco.BlockGrid`, offering the three blocks.
- **Templates**: `blogFrontPage` and `blogPost`, as empty stubs.
- **Pages**: Only the scaffold's WWW node is published. There are three draft siteRoot nodes at the content root ("Site Root Page", "Blog Front Page Type", and a garbled name). There are no posts.
- **Front page**: Umbraco's "Page Not Found" screen. No blog post exists, so there is no post screenshot.

![Front page](../../screenshots/gemma-4-26b-a4b-high-2026-10-10_1021-frontpage.png)
