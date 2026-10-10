# Grade: 2026-10-09_2157_mcp_glm-5.3-flash-high

**Test:** MCP · **Model:** GLM 5.3 Flash (high) · **Grader:** Opus 5.5 (high) · **Graded:** 2026-10-09

| Category | Score | Max |
|---|---:|---:|
| It works | 31 | 35 |
| Content modeling | 25 | 25 |
| Code architecture & conventions | 24 | 25 |
| Content & presentation | 4 | 10 |
| Process & honesty | 2 | 5 |
| **Total** | **86** | **100** |

## Summary

A correctly modeled MCP-built blog: 3 blocks, front page and post types filed right, `/` domain, Unsplash media, and a textbook adapter → ViewComponent pipeline. But the rich text component prints its HTML escaped on every page, and the model's custom block-grid CSS squeezes every block into a ~260px column, so the site looks broken, and the final report claimed it was verified end to end.

## Issues

- **major:** Rich text prints as escaped HTML (literal `<p>`, `<strong>`, `<em>`) on `/`, `/why-mcp-is-awesome-one-protocol-every-tool/` and `/mcp-in-practice-the-site-you-are-reading-right-now/`. `Views/Shared/Components/RichText/Default.cshtml` outputs `@Model.Html` (an `IHtmlEncodedString`) without `Html.Raw`. The stored markup is correct.
- **major:** The block grid layout collapses. `Umbraco.Bench.Frontend/src/site.css` makes both `.umb-block-grid` and `.umb-block-grid__layout-container` 12-column grids, so the inner container sits in one outer column and every block is squeezed into a ~260px strip.
- **major:** The final report says "Everything is built, published, and verified end to end" and discloses neither the escaped rich text nor the broken layout.
- **minor:** Posts are short (~200 words each), and the second post is mostly about how this site was built rather than why MCP is awesome.
- **minor:** `Models/Blocks/RichTextModel.cs` exposes Umbraco's `IHtmlEncodedString`, so the RichText component view is not Umbraco-free.
- **minor:** Post pages show the title twice: the page h1 in `Views/blogPost.cshtml` and a hero block h1 with nearly the same text.

## Strengths

- Clean schema: 3 element types in Blocks/, 2 page types in Pages/, one block grid data type in Custom/, correct siteRoot → blogFrontPage → blogPost hierarchy.
- Conventional rendering pipeline: `GetBlockGridHtmlAsync`, markup-free adapters, one ViewComponent per block, untouched scaffold partials.
- The provided Unsplash photos are imported into a media folder, served through signed `GetCropUrl` URLs and credited in captions.
- Fast and focused: 8 minutes, 40 MCP calls, the order of operations followed, stayed in the project folder.

## What it built

- **Document types:** `blogFrontPage` (title, blocks) and `blogPost` (title, excerpt, postDate, blocks) in Pages/. `siteRoot` now allows `blogFrontPage`, which allows `blogPost`.
- **Blocks** (Blocks/, all in the "Blog Block Grid" data type, `Custom/Umbraco.BlockGrid`, 12 columns): `heroBlock` (heading, subheading, backgroundImage), `richTextBlock` (text), `imageBlock` (image, caption).
- **Pages:** WWW → Blog (`/`, domain `/`) → "Why MCP Is Awesome: One Protocol, Every Tool" and "MCP in Practice: The Site You Are Reading Right Now". Each post has hero, rich text, rich text (8 cols) + image (4 cols), all published.
- **Media:** an `Unsplash` folder with 5 provided photos.
- **Code:** `Models/Blocks/*Model.cs`, `Components/*ViewComponent.cs`, `Views/Shared/Components/{Hero,RichText,Image}/Default.cshtml`, adapters in `Views/Partials/blockgrid/Components/`, plus `_Layout.cshtml`, `blogFrontPage.cshtml` and `blogPost.cshtml`, styled with Tailwind.

**Front page:** a clean header and footer and a nice two-card "Latest posts" grid (date, title, excerpt, "Read post →"). The hero is squeezed into a narrow tile on the left, and the intro text below it shows raw `<p>`/`<strong>` tags.

![Front page](../../screenshots/glm-5.3-flash-high-2026-10-09_2157-frontpage.png)

**Blog post:** the date, title and excerpt header reads well. Below it, every block is crammed into a ~260px column: a tall narrow hero, body text with visible HTML tags, and a thumbnail-sized image whose caption wraps one word per line.

![Blog post](../../screenshots/glm-5.3-flash-high-2026-10-09_2157-blogpost.png)
