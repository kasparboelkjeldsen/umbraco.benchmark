# Grade: 2026-10-12_1016_mcp-recipe_mistral-small-2603-high

**Model:** Mistral Small 2603 (high) · **Test:** MCP Recipe · **Grader:** Opus 5.5 (high) · **Total: 27 / 100**

| Category | Score | Max |
|---|---:|---:|
| It works | 6 | 35 |
| Content modeling | 16 | 25 |
| Code architecture & conventions | 2 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 3 | 5 |
| **Total** | **27** | **100** |

## Summary

Mistral Small built the three blocks, the Blog Block Grid, two page types and the media import over MCP. Then its `update-document-type` calls kept failing validation, so `siteRoot` never allowed `blogFrontPage` and every `create-page` returned "Operation not permitted". It gave up with no pages, no domain and no Razor, so `/` is a 404 and the site is empty.

## Issues

- **major**: `https://localhost:44317/` returns 404 "No template exists to render the document at URL '/'". No front page or blog post documents exist. `snapshot.json` has only the scaffold's `WWW` and a draft "Site Home".
- **major**: Of the 17 `update-document-type` calls, 14 failed input validation, because they sent partial objects missing `cleanup`, `compositions`, `properties` and `collection`. As a result:
  - `siteRoot` never allowed `blogFrontPage`
  - `blogFrontPage` never allowed `blogPost`
  - `blogPost` has no template

  All 12 `create-page` attempts then failed with NotAllowed, ParentNotFound or PropertyTypeNotFound.
- **major**: The model wrote no Razor or C#. `Views/blogFrontPage.cshtml`, `Views/blogPost.cshtml`, `Views/blogFront.cshtml` and `Views/blogPostDoc.cshtml` are empty `create-template` stubs. There are no adapters, ViewComponents or view models, and `wwwroot/dist/site.css` was never built.
- **major**: Recipe steps 6–11 were skipped: domain, publish, `dotnet build`, Razor, frontend build, restart and curl checks.
- **minor**: Workaround leftovers:
  - duplicate empty page types `blogFront` and `blogPostDoc`, with orphan templates
  - a second `siteRoot` document, "Site Home", left as a draft at root
- **minor**: The final report says schema modeling was "completed successfully", and blames "document type configuration in the Umbraco instance itself". The failures came from the model's own malformed update calls. Otherwise the report is candid that nothing was built past the schema.

## What it built

- **Document types**
  - `siteRoot` (Repositories, scaffold, unchanged: no allowed children)
  - `blogFrontPage` (Pages: title, intro, body block grid; template set; no allowed children)
  - `blogPost` (Pages: title, publishDate, excerpt, listingImage, body block grid; **no template**)
  - Duplicates: `blogFront` and `blogPostDoc` (Pages, no properties, own templates)
- **Blocks** (Blocks folder, elements), all in the `Blog Block Grid` data type (`/Custom/Umbraco.BlockGrid`, 12 columns):
  - `richTextBlock` (text)
  - `imageBlock` (image, caption)
  - `quoteBlock` (quote, attribution)
- **Media:** a "Blog Photos" folder with 4 of the provided Unsplash photos: circuit-board, code-on-screen, laptop-desk-code and network-lines-dots.
- **Pages:** none. The only content is the scaffold's `WWW` and the stray draft "Site Home" (both `siteRoot`). There is no domain.
- **Front page:** Umbraco's built-in 404 page.
- **Blog post:** none exists, so there is no screenshot.

![Front page](../../screenshots/mistral-small-2603-high-2026-10-12_1016-frontpage.png)
