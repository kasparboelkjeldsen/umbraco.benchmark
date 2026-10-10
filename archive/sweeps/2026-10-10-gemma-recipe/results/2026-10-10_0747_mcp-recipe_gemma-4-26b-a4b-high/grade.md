# Grade: 2026-10-10_0747_mcp-recipe_gemma-4-26b-a4b-high

**Test:** MCP Recipe · **Model:** Gemma 4 26B A4B (high) · **Grader:** Opus 5.5

| Category | Score | Max |
|---|---:|---:|
| It works | 5 | 35 |
| Content modeling | 4 | 25 |
| Code architecture & conventions | 1 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 2 | 5 |
| **Total** | **12** | **100** |

## Summary

The run timed out after 2 hours having built only a skeleton schema: three property-less block element types, two empty page doc types filed at the root, a block grid data type used nowhere, and two empty auto-generated template stubs. No content, media, domain or Razor code exists, and `/` returns 404.

## Issues

- **major**: `/` returns 404 "No template exists to render the document at URL '/'". No blog front page or posts were created (`snapshot.json` has only the scaffold's WWW node).
- **major**: All document types have zero properties. `blogFrontPage` and `blogPost` have no block grid, no allowed children and no assigned templates.
- **major**: No Razor written. `Views/blogFrontPage.cshtml` and `Views/blogPost.cshtml` are empty `create-template` stubs. There are no adapters, ViewComponents or models.
- **major**: No media imported and no domain on any page.
- **major**: The run hit the 2-hour turn timeout while looping on malformed `update-document-type` calls (22 failed tool calls). There is no final report.
- **minor**: `blogFrontPage` and `blogPost` are filed at the document-type root instead of in Pages.
- **minor**: There is a duplicate "Blog Block Grid (1)" data type and an orphaned "Image Cropper" data type in `/Custom`.

## What it built

- **Document types:** `richTextBlock`, `imageBlock`, `quoteBlock` (elements in Blocks, no properties); `blogFrontPage`, `blogPost` (documents at the root, no properties). The `siteRoot` type is from the scaffold.
- **Data types:** "Blog Block Grid" (lists the three blocks, used by no doc type), "Blog Block Grid (1)" (duplicate), "Image Cropper".
- **Templates:** `blogFrontPage`, `blogPost`. These are empty stubs and are not assigned to the doc types.
- **Pages:** none beyond the scaffold's WWW node. No media, no domain.
- **Front page:** Umbraco's "Page Not Found" screen. There is no blog post to screenshot.

![Front page](../../screenshots/gemma-4-26b-a4b-high-2026-10-10_0747-frontpage.png)
