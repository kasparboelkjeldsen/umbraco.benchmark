# Grade: 2026-10-09_2213_mcp_mistral-large-4-high

**Test:** MCP · **Model:** Mistral Large 4 (high, via OpenRouter) · **Grader:** Opus 5.5 (high) · **Total: 30 / 100**

| Category | Score | Max |
|---|---:|---:|
| It works | 6 | 35 |
| Content modeling | 22 | 25 |
| Code architecture & conventions | 0 | 25 |
| Content & presentation | 1 | 10 |
| Process & honesty | 1 | 5 |
| **Total** | **30** | **100** |

## Summary

Mistral Large 4 modeled a clean schema over MCP: 4 blocks in Blocks, blogFrontPage and blogPost in Pages, a Custom block grid data type, and a domain on the site page. It also created two short MCP posts with imported Unsplash photos. Then it spent 30 minutes debugging why the front page's block grid value was dropped, and hit the 1-hour timeout without writing any Razor. Every page is a blank 200.

## Issues

- **major**: No Razor was written. `Umbraco.Bench.Umbraco/Views/BlogFrontPage.cshtml` and `Views/BlogPost.cshtml` are the one-line stubs from MCP `create-template`. `/`, `/why-mcp-is-awesome-one-protocol-every-tool/` and `/why-mcp-is-awesome-content-at-the-speed-of-thought/` all return blank 200 pages.
- **major**: There are no block adapters (`Views/Partials/blockgrid/Components/`), no ViewComponents and no view models, and nothing calls `GetBlockGridHtmlAsync`.
- **major**: The run timed out after 1:00:00 with no final report. Its last ~30 minutes went to reading Umbraco source from GitHub and the MCP package internals instead of finishing the steps.
- **minor**: Off-channel diagnostics: 2 direct Management API GETs with curl, using the MCP client secret. It also wrote a SQLite query script against `umbraco/Data/Umbraco.sqlite.db` but never ran it.
- **minor**: The front page block grid is empty because the hero/intro saves were silently dropped. A duplicate draft `Blog (1)` front page is left under WWW.
- **minor**: The post "Why MCP is awesome: content at the speed of thought" is left in PublishedPendingChanges.
- **minor**: Outside-folder access: Umbraco source downloaded to %TEMP%, the MCP package dist read from the npm cache, and a script that parsed its own session transcript.

## Strengths

- Document types are filed correctly, and siteRoot's allowed children were extended to blogFrontPage.
- Post metadata (excerpt, featuredImage, publishedDate) are real properties, and each post body has 4 block grid blocks.
- The provided Unsplash photos were imported via MCP into a `Blog` media folder, and domain `/` was assigned to the site page.

## What it built

- **Document types:** `heroBlock` (heading, lead, backgroundImage), `textBlock` (rich text body), `imageBlock` (image, caption) and `quoteBlock` (quote, attribution) are elements in **Blocks**. `blogFrontPage` (blocks) and `blogPost` (excerpt, featuredImage, publishedDate, body) are in **Pages**. The scaffold's `siteRoot` is in Repositories.
- **Data types:** one `Block Grid` (`Custom/Umbraco.BlockGrid`) allowing the four blocks, used by both page types.
- **Templates:** `BlogFrontPage` and `BlogPost`, assigned as defaults, but their views are empty stubs.
- **Content:** WWW → Blog (domain `/`) → two posts, each with 4 blocks: 2 rich text, image, quote. Also a stray draft `Blog (1)` under WWW.
- **Media:** 5 provided Unsplash photos in a `Blog` folder.
- **Code:** none. The only file changes are the Tailwind build output (`wwwroot/dist/*`) and `Umbraco.Bench.Frontend/package-lock.json`.

Both screenshots are blank white pages, because the views render nothing.

![Front page](../../screenshots/mistral-large-4-high-2026-10-09_2213-frontpage.png)

![Blog post](../../screenshots/mistral-large-4-high-2026-10-09_2213-blogpost.png)
