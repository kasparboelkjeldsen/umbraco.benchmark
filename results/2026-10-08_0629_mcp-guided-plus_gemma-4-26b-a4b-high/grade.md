# Grade: 2026-10-08_0629_mcp-guided-plus_gemma-4-26b-a4b-high

**Total: 17 / 100**. Test: MCP Guided+. Model: Gemma 4 26B A4B. Graded by Opus 5.5 (high).

| Category | Score | Max |
|---|---:|---:|
| It works | 0 | 35 |
| Content modeling | 14 | 25 |
| Code architecture & conventions | 2 | 25 |
| Content & presentation | 0 | 10 |
| Process & honesty | 1 | 5 |
| **Total** | **17** | **100** |

## Summary

The model got only partway through step 3. It made three blocks, a Blog Block Grid data type, and front page and post types filed in the right folders. It never assigned templates or allowed children, and it created no media, pages or domain. The two templates it wrote break the build, and the run timed out after 2 hours with no report.

## What it built

- **Blocks** (element types in *Blocks*): `headingBlock` (headingText: Textstring), `imageBlock` (image: Image media picker), `richTextBlock` (content: Rich text).
- **Data type:** `Blog Block Grid` in `Custom/Umbraco.BlockGrid`, 12 columns, allowing all three blocks. Two orphan copies were left behind: `Blog Block Grid (1)` and `(2)`.
- **Page types** (in *Pages*): `blogFrontPage` (title, date, excerpt, listingImage, bodyContent) and `blogPost` (title, excerpt, image, bodyContent). They have no allowed children and no assigned templates.
- **Templates:** `blogFrontPageTemplate` and `blogPostTemplate`, created via MCP with Razor that calls `GetBlockGridHtmlAsync`. Both inherit a non-existent type, so the build fails.
- **Content:** none. Only the scaffold's empty `WWW` node exists. There are no media and no domain.
- **Front page / posts:** nothing renders. The build fails, so Umbraco would not start for `npm run check`, and `npm run screenshot` could not run ("Umbraco isn't running"). No screenshots exist for this run.

## Issues

- **major**: `dotnet build` fails with CS0234. The templates inherit `UmbracoViewPage<Umbraco.Cms.Web.Common.Models.PublishedContent>`, which does not exist (`Views/blogFrontPageTemplate.cshtml:1`, `Views/blogPostTemplate.cshtml:1`). The site cannot boot.
- **major**: There is no content at all: no front page, posts, media or domain. Steps 4-12 were never reached.
- **major**: Templates were never assigned and allowed children never set. About 20 `update-document-type` calls all failed input validation.
- **major**: There are no block adapters, ViewComponents or view models, and the frontend was never built (no `wwwroot/dist/site.css`).
- **major**: The run timed out at 2:00:00 after long read loops (`get-all-document-types` / `list-children`), with no final report.
- minor: Orphan duplicate data types `Blog Block Grid (1)` and `Blog Block Grid (2)`.
- minor: Post metadata is on the wrong types. `date` and `listingImage` are on `blogFrontPage`, and `blogPost` has no date.
- minor: A stray `umbraco_log.txt` was left in `Umbraco.Bench.Umbraco/`.

## Category notes

**It works (0/35)**: dotnet build fails with 2 errors (CS0234): both templates inherit UmbracoViewPage<Umbraco.Cms.Web.Common.Models.PublishedContent>, a type that does not exist (Views/blogFrontPageTemplate.cshtml:1, Views/blogPostTemplate.cshtml:1). Build 0/5. Because of that the site did not boot for npm run check (site.boots FAIL, no snapshot, no crawl), and screenshots could not be taken. Even ignoring the build, there is nothing to render: no front page or post documents were ever created (zero create-page/add-blockgrid-block calls), so front page 0/10 and posts 0/10. No media was imported (no create-media calls), so images 0/5. No domain was set and nothing was published, so domain/publish 0/5.

**Content modeling (14/25)**: Folders 8/8: headingBlock (Textstring), imageBlock (Image media picker) and richTextBlock (Rich text) are element types moved into Blocks; blogFrontPage and blogPost are document types in Pages. Block grid 5/7: the 'Blog Block Grid' data type (Custom/Umbraco.BlockGrid, 12 columns) allows all three blocks, and both page types use it as bodyContent. It is a sensible reusable set, but nothing ever used it in content. Structure 1/5: siteRoot is still the only root type, aliases are camelCase and the data type sits in /Custom. But no allowed children were set (siteRoot and blogFrontPage both have empty Structure), and neither template is assigned to its type: every update-document-type call failed input validation. Hygiene 0/5: the post metadata is split wrongly. date and listingImage are on blogFrontPage, while blogPost has title, excerpt and image but no date. Retrying create-data-type left two orphan duplicates, 'Blog Block Grid (1)' and 'Blog Block Grid (2)', with the same config.

**Code architecture & conventions (2/25)**: The only code is the two templates, written through MCP create-template during step 3. They call Html.GetBlockGridHtmlAsync(Model, "bodyContent") with no custom block loops, and the scaffold's blockgrid partials are untouched (2/7). But they don't compile (the build failure is deducted under 'It works'), and the post template reads Model.Value<IPublishedContent>("image") instead of the ModelsBuilder property. There are no adapters in Views/Partials/blockgrid/Components/ (0/6), and there are no ViewComponents or view models (0/7). Conventions 0/5: the frontend was never built (no wwwroot/dist/site.css), and a stray umbraco_log.txt was left in the project. Program.cs, appsettings.json and Migrations are untouched, but only because steps 7-10 were never reached, so that earns no credit.

**Content & presentation (0/10)**: There are no posts, no text content, no images and no rendered layout. The site cannot even start because the build fails, so no screenshots exist.

**Process & honesty (1/5)**: Channel 1/3. Schema went only through the Umbraco MCP servers (101 MCP calls, 38 writes; no browser, migration, Management API, uSync or DB use). The model stayed in the project folder and did not touch memory. The .mcp.json diff is the guided-plus test setup, not the model: the transcript has no edit to it. But it never finished step 3. Templates were never assigned and allowed children were never set: about 20 update-document-type calls failed Zod validation, sometimes with mangled escaped-quote keys. It also tried set-page-template and list-page-templates with a document type id. It then looped for most of the two hours on get-all-document-types and list-children reads and re-created the Blog Block Grid data type twice, until the turn timed out at 2:00:00. Steps 4-12 were never reached. Honesty 0/2: there is no final report (the turn timed out), so the broken build and the missing content were never disclosed.

