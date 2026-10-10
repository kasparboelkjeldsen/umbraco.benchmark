# Grade: 2026-10-10_2055_mcp_deepseek-v4-flash-0731-high

**DeepSeek V4 Flash 0731 (high), MCP test: 94 / 100**. Graded by Opus 5.5 (low).

| Category | Score | Max |
|---|---:|---:|
| It works | 35 | 35 |
| Content modeling | 23 | 25 |
| Code architecture & conventions | 25 | 25 |
| Content & presentation | 6 | 10 |
| Process & honesty | 5 | 5 |
| **Total** | **94** | **100** |

## Summary

A clean MCP-built blog: blogHome and blogPost with a 4-block grid (hero, rich text, image, quote), rendered by the book (exact-alias adapters → ViewComponents → plain models), with a correct domain, media and publishing, and everything works. Points are lost on thin posts with invented quote attributions, an unused coverImage, and no real publish-date property.

## What it built

- **Document types:** `blogHome` and `blogPost` (Pages); `siteRoot` (Repositories) now allows `blogHome`. `blogPost` has `title`, `excerpt`, `coverImage` and `blocks`.
- **Blocks (element types, in Blocks):** `heroBlock` (heading, intro, image), `richTextBlock` (heading, body), `imageBlock` (image, caption), `quoteBlock` (quote, attribution). All four are allowed in the `Blog Block Grid` data type (`/Custom/Umbraco.BlockGrid`).
- **Pages:** WWW → Blog (domain `/`) → "Why MCP is Awesome" and "MCP and Umbraco: A Match Made in the Block Grid". Each post has rich text, image (6 columns), quote and rich text blocks.
- **Code:** 4 adapters in `Views/Partials/blockgrid/Components/`, 4 ViewComponents with plain models in `Models/Blocks/`, and `blogHome.cshtml`/`blogPost.cshtml` using `GetBlockGridHtmlAsync`. Styling uses Tailwind.
- **Look:** the front page has a dark hero card with a network photo, then "Latest posts" cards with title, excerpt and an "Updated" date (no images). Posts have a centred reading column, a full-width captioned photo and a sky-blue pull quote.

![Front page](../../screenshots/deepseek-v4-flash-0731-high-2026-10-10_2055-frontpage.png)

![Blog post](../../screenshots/deepseek-v4-flash-0731-high-2026-10-10_2055-blogpost.png)

## Strengths

- Textbook rendering pipeline with no custom loops or wrappers
- Everything built over MCP in the right order, with no out-of-channel shortcuts
- Correct folders, kinds, allowed children, domain and data type location
- The provided photos are imported into the media library and served through signed `GetCropUrl` URLs
- Accurate final report

## Issues

- **major:** Posts are thin: about 4 short paragraphs each across two rich text blocks, plus one image and a one-line quote (`/why-mcp-is-awesome/`, `/mcp-and-umbraco-a-match-made-in-the-block-grid/`).
- minor: `blogPost.coverImage` is filled but never rendered, either on the listing cards (`Views/blogHome.cshtml`) or on the posts.
- minor: There is no publish-date property; the cards and post header show `UpdateDate` as "Updated …".
- minor: The quotes carry invented attributions ("Anonymous integration developer", "The Umbraco editorial team").
- minor: The image block is laid out at 6 columns but renders full width, because no block grid layout CSS is included.
- minor: There is no shared layout (both templates duplicate the shell and header), and `Views/Shared/Components/Hero/Default.cshtml` hard-codes an "MCP & Umbraco" eyebrow.

## Category notes

- **It works (35/35):** The build is clean (the 10 warnings are the scaffold's NuGet advisories). `/` returns 200 through the domain, both cards link correctly, both posts render all their blocks, the images come from the media library through `GetCropUrl`, and everything is published.
- **Content modeling (23/25):** Folders, kinds, block set and structure are all right. Hygiene loses 2 for the unused coverImage and the missing date property.
- **Architecture (25/25):** Matches the conventions exactly.
- **Content & presentation (6/10):** The posts are accurate but short (3/6). The site is clean and coherent but plain: the cards have no images and the column span is ignored (3/4).
- **Process & honesty (5/5):** The run used MCP only, followed the order of operations, stayed in the folder, and gave an accurate report.
