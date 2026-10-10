# Grade: 2026-10-09_1949_mcp_mistral-large-4-high

**Test:** MCP · **Model:** Mistral Large 4 (high) · **Grader:** Opus 5.5 (low) · **Total: 71 / 100**

| Category | Score | Max |
|---|---:|---:|
| It works | 21 | 35 |
| Content modeling | 20 | 25 |
| Code architecture & conventions | 23 | 25 |
| Content & presentation | 4 | 10 |
| Process & honesty | 3 | 5 |
| **Total** | **71** | **100** |

## Summary

Mistral Large 4 built a clean, convention-following Umbraco blog over MCP: four blocks with adapter→ViewComponent rendering, good doc type structure, and a nice Tailwind front page listing with images, dates and excerpts. But the Block Grid data type was created with no allowed blocks, so no block renders anywhere. Both post pages are blank apart from date and back link, and the session timed out debugging this with no final report.

## What it built

- **Document types:** `siteRoot` (Repositories, the only type allowed at root) → `blogFrontPage` (Pages, template `blogFrontPage`, property `blocks`) → `blogPost` (Pages, template `blogPost`, properties `summary`, `featuredImage`, `publishDate`, `blocks`).
- **Blocks (element types in Blocks):** `heroBlock` (heading, lede, backgroundImage), `richTextBlock` (body), `imageBlock` (image, caption), `quoteBlock` (quote, attribution).
- **Data type:** `Block Grid` in `Custom/Umbraco.BlockGrid`, created with **no blocks configured**.
- **Content:** WWW (siteRoot) → Home (domain `/`) → two posts, *"MCP is awesome: one protocol, every tool"* and *"MCP is awesome: content at the speed of thought"*. Each has hero, rich text, image, quote and rich text blocks stored, about 170 words of body each. There are 5 provided Unsplash photos in a `Blog` media folder.
- **Code:** 4 adapters in `Views/Partials/blockgrid/Components/`, 4 ViewComponents (`Hero`, `ImageBlock`, `Quote`, `RichText`), plain models in `Models/Blocks/`, a Tailwind layout. Page views call `Html.GetBlockGridHtmlAsync`.
- **Front page:** a clean header, "Latest posts" with two cards (cropped image, date, title, excerpt), and a footer. The hero and intro blocks don't render.
- **Post pages:** only "Published October 9, 2026" and "← All posts". No title, text, image or quote renders.

![Front page](../../screenshots/mistral-large-4-high-2026-10-09_1949-frontpage.png)

![Blog post](../../screenshots/mistral-large-4-high-2026-10-09_1949-blogpost.png)

## Issues

- **major:** The `Block Grid` data type was created with `values: []` (no allowed blocks), so `GetBlockGridHtmlAsync` outputs nothing on `/`, `/mcp-is-awesome-one-protocol-every-tool/` and `/mcp-is-awesome-content-at-the-speed-of-thought/`.
- **major:** Post pages are blank apart from date and back link. The post title only exists in the hero block (`Views/blogPost.cshtml`).
- **major:** There is no final report. The session hit the one-hour limit while debugging with reflection scripts and never disclosed that the posts are blank.
- **minor:** The posts are short (~170 words of body each).
- **minor:** Scratch scripts were left in the solution: `Umbraco.Bench/.scratch/reflect*.fsx`.
- **minor:** `Models/Blocks/RichTextModel.cs` exposes Umbraco's `IHtmlEncodedString`, so the component model is not Umbraco-free.
- **minor:** Each post's hero block repeats the post name and summary.

## Strengths

- Textbook block rendering: `GetBlockGridHtmlAsync`, camelCase adapters with no markup, one ViewComponent per block, plain models.
- Correct folders, element vs document kinds, hierarchy, templates and domain. Everything is published.
- The listing uses real metadata properties and `GetCropUrl` images from the provided photos.
- Everything was built through MCP, with Razor written after the restart.
