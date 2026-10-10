# Grade: 2026-10-10_0952_mcp-recipe_gemma-4-26b-a4b-high

**Test:** MCP Recipe · **Model:** Gemma 4 26B A4B (high) · **Grader:** Opus 5.5 (low)

| Category | Score | Max |
|---|---:|---:|
| It works | 5 | 35 |
| Content modeling | 14 | 25 |
| Code architecture & conventions | 1 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 2 | 5 |
| **Total** | **22** | **100** |

## Summary

The run was stopped by the benchmark guard after 24 minutes, while looping on malformed `update-document-type` calls (13 failed calls). It left a partial schema: three block element types with sensible properties, a block grid data type, and two page types with metadata and body properties, but no allowed children and no assigned templates. There is no content, media, domain or Razor, and `/` returns 404.

## Issues

- **major**: `/` returns 404 "No template exists to render the document at URL '/'". There is no blog front page and there are no posts. `snapshot.json` holds only the scaffold's WWW node.
- **major**: No Razor was written. `Views/blogFrontPage.cshtml` and `Views/blogPost.cshtml` are empty `create-template` stubs, and there are no adapters, ViewComponents or view models.
- **major**: The schema is left unwired. `siteRoot`, `blogFrontPage` and `blogPost` have no allowed children, and the templates are not assigned to the page types.
- **major**: The benchmark guard stopped the run after 4 identical malformed `update-document-type` calls (an invalid GUID with an escaped quote and a missing `id`). There is no final report.
- **major**: No media was imported and no document has a domain.
- **minor**: `quoteBlock` is filed at the document-type root instead of Blocks.

## Strengths

- The block element types have sensible properties (rich text; image + caption; quote + attribution), in a `/Custom` "Blog Block Grid" data type.
- `blogPost` has real metadata properties (`publishDate`, `excerpt`, `listingImage`), and both page types use the block grid for `body`.
- It worked only through the MCP channel and stayed in the project folder.

## What it built

- **Document types:** `richTextBlock` (text), `imageBlock` (image, caption) and `quoteBlock` (quote, attribution) are elements. The first two are in Blocks and `quoteBlock` is at the root. `blogFrontPage` (title, intro, body) and `blogPost` (title, publishDate, excerpt, listingImage, body) are documents in Pages. `siteRoot` is from the scaffold.
- **Data types:** "Blog Block Grid" in `/Custom`, which allows all three blocks at the root.
- **Templates:** `blogFrontPage` and `blogPost` exist as empty stubs and are not assigned.
- **Pages:** none beyond the scaffold's WWW node. There is no media and no domain.
- **Front page:** Umbraco's "Page Not Found" screen. There is no blog post to screenshot.

![Front page](../../screenshots/gemma-4-26b-a4b-high-2026-10-10_0952-frontpage.png)
