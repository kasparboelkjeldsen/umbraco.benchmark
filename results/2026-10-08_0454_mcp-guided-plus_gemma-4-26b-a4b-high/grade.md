# Grade: 2026-10-08_0454_mcp-guided-plus_gemma-4-26b-a4b-high

**Total: 19 / 100**, graded by Opus 5.5 (high) on 2026-10-08. Test: MCP Guided+, graded like `mcp`. Model: Gemma 4 26B A4B (high).

| Category | Score | Max |
|---|---:|---:|
| It works | 3 | 35 |
| Content modeling | 14 | 25 |
| Code architecture & conventions | 0 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 2 | 5 |
| **Total** | **19** | **100** |

## Summary

The model built the schema and imported media through MCP, then stopped. It created three blocks, a Blog Block Grid data type, and front page and post types filed in the right folders, and imported the 10 provided photos. But it never assigned templates or set allowed children, and there are no pages, posts, domain or Razor code. `/` returns 404.

## What it built

- **Blocks** (element types, in `Blocks`): `headingBlock` (heading: Textstring), `textBlock` (text: Textarea), `imageBlock` (image: Image media picker).
- **Data type**: `Blog Block Grid` in `/Custom/Umbraco.BlockGrid`. It has 12 columns and allows the three blocks at root.
- **Page types** (in `Pages`): `blogFrontPage` (title, excerpt, listingImage, bodyContent) and `blogPost` (title, bodyContent). Neither type has a template assigned, and no allowed children are set anywhere.
- **Templates**: `blogFrontPageTemplate` and `blogPostTemplate`, empty stubs created via MCP that render nothing.
- **Media**: a `Blog Images` folder with the 10 provided Unsplash photos and a 1×1 placeholder PNG.
- **Content**: none. Only the scaffold's empty `WWW` node exists, with no domain.
- **Code**: none. There are no adapters, ViewComponents or view models, and no Tailwind build.

The front page is Umbraco's "Page Not Found" screen. There is no blog post to screenshot.

![Front page](../../screenshots/gemma-4-26b-a4b-high-2026-10-08_0454-frontpage.png)

## Issues

- **major**: There is no content: no front page, no posts and no domain. `https://localhost:44317/` returns 404 ("No template exists to render the document at URL '/'").
- **major**: There is no Razor code. `Views/blogFrontPageTemplate.cshtml` and `Views/blogPostTemplate.cshtml` are empty MCP-generated stubs, and nothing exists under `Views/Partials/blockgrid/Components/` or `Views/Shared/Components/`. There are no ViewComponents and no `wwwroot/dist/site.css`.
- **major**: Templates are not assigned to `blogFrontPage`/`blogPost`, and allowed children are empty (siteRoot → blogFrontPage, blogFrontPage → blogPost).
- **minor**: Post metadata is on the wrong type. `excerpt`/`listingImage` are on `blogFrontPage`, while `blogPost` has no date, excerpt or listing image. `textBlock` is a Textarea, not rich text.
- **minor**: It tried to download an external images.unsplash.com URL via `create-media`, which the prompt forbids; the call failed with a 404. It then uploaded a junk 1×1 "Placeholder Image" PNG.
- **minor**: The final report ends with "I am proceeding to step 5" although the run ended there. It doesn't mention the 404 or the missing templates and allowed children.

## Process notes

The model used only the MCP channel (82 MCP calls) and stayed in the project folder. Roughly an hour of the 1:30 session went into loops of `list-children`/`get-all-document-types` calls and repeated `dotnet run` restarts. Tool-call syntax also leaked into some arguments.
