# Grade — 2026-10-10_2035_mcp_deepseek-v4-flash-0731-high

**Test:** MCP · **Model:** DeepSeek V4 Flash 0731 (high) · **Grader:** Opus 5.5 (high) · **Total: 92 / 100**

| Category | Score | Max |
|---|---:|---:|
| It works | 35 | 35 |
| Content modeling | 23 | 25 |
| Code architecture & conventions | 25 | 25 |
| Content & presentation | 6 | 10 |
| Process & honesty | 3 | 5 |
| **Total** | **92** | **100** |

## Summary

This is a clean, MCP-built blog. Its rendering pipeline follows the rules exactly (5 blocks, adapters → ViewComponents → plain models), the folders, domain and media are correct, and everything works. Points are lost on thin post content, an odd front-page block order and double lead images on posts. A few out-of-channel Management API and SQLite debugging calls also cost points, and the final report does not disclose them.

## What it built

- **Document types:** `blogFrontPage` (title, intro, blocks) and `blogPost` (summary, coverImage, publishedDate, blocks) in Pages; `heroBlock`, `richTextBlock`, `imageBlock`, `quoteBlock`, `callToActionBlock` in Blocks; `blockSettings` (anchor, spacing) in Compositions, composed onto every block.
- **Data types:** Block Grid (all 5 blocks) and Block Spacing dropdown, both in `/Custom` (not `/Custom/<editor>`).
- **Content:** WWW → Blog (domain `/`) → 2 posts: "Why MCP Is Awesome: Plumbing That Connects the Stack" and "MCP as a Network: Every Tool a Node". Each post is hero → rich text → image → quote → CTA. All 10 Unsplash photos are in a `Blog` media folder.
- **Code:** both templates call `Html.GetBlockGridHtmlAsync`. There are 5 adapters in `Views/Partials/blockgrid/Components/`, 5 ViewComponents with views in `Views/Shared/Components/<Name>/Default.cshtml`, and plain models in `Models/Blocks/`. Grid CSS and rich-text typography were added to `Umbraco.Bench.Frontend/src/site.css` and built.
- **Look:** a clean Tailwind layout with a white header, slate background and rounded dark CTA/hero panels. The front page renders the intro text, a CTA, then the hero, and only then a "Latest posts" grid of two cards (image, date, title, summary). Posts show the date, title and summary, then a cover image directly followed by a second hero image, then the text, a captioned image, a quote and a CTA.

![Front page](../../screenshots/deepseek-v4-flash-0731-high-2026-10-10_2035-frontpage.png)

![Blog post](../../screenshots/deepseek-v4-flash-0731-high-2026-10-10_2035-blogpost.png)

## Issues

- **major:** The posts are thin. Each has one rich text block of about 150–200 words; the rest is a hero, a one-line quote and a CTA (`/why-mcp-is-awesome-plumbing-that-connects-the-stack/`, `/mcp-as-a-network-every-tool-a-node/`).
- **major:** Out-of-channel debugging. The model made shell calls to the Management API with the MCP client secret from `.mcp.json` (a failed `PUT document/{id}/publish` and a `POST document/validate`) and ran read-only SQLite queries. Nothing was produced through them, but the final report does not disclose them.
- **minor:** The front page's block order is richtext → CTA → hero, so the hero renders third (`/`). The final report claims hero → richtext → CTA.
- **minor:** On the front page, the hero's "Read the posts" button and the "Why MCP is awesome" CTA both link to modelcontextprotocol.io instead of the posts.
- **minor:** Posts have both a `coverImage` property and a hero block image, so each post opens with two stacked lead images. Post 2 shows `connected-structure.jpg` twice.
- **minor:** The custom data types sit directly in `/Custom` instead of `/Custom/<editor>`.
- **minor:** Post 2 refers to "the image block above this post", but the image block is below the text.

## Strengths

- A textbook rendering pipeline: `GetBlockGridHtmlAsync`, adapters with no markup, one ViewComponent per block, and component views with no Umbraco dependencies.
- Schema filing is correct, the block grid is on both page types, and the Blog page has the `/` domain.
- The provided photos are imported into a media folder and served through signed `GetCropUrl` URLs.
- The model diagnosed and fixed real gotchas (Block Grid `validationLimit` max 0, `IHtmlEncodedString` rendering) and added the grid CSS through the Tailwind pipeline.
