# Test: MCP Guided

The MCP test for small models: the same site, rules and rubric as `mcp.md`, made easier in two ways.

- **The prompt** is short and ends with the order of operations as numbered steps, including the details small models got wrong: allowed children, the domain on the front page, page values, publishing, the block grid namespace.
- **The tool kit** is slim: 44 tools (~28k tokens) instead of 160 (~77k). The Umbraco dev MCP server keeps only schema, media import and the domain; pages, blocks and publishing go through Umbraco's editor MCP server (`@umbraco-cms/mcp-editor`), whose `add-blockgrid-block` builds the block grid value itself. The tool lists are in `bench/lib/variants.mjs`; the editor server runs from a pinned, patched install (`bench/mcp-editor/README.md`: the published beta hid Umbraco's error messages).

Not part of the real benchmark: it is for comparing small models with each other.

Setup: `npm run setup -- mcp-guided`, then `npm run up`. Headless: `npm run auto -- --test mcp-guided --model <ids>`.

## Prompt 1 (Umbraco running)

```text
verify you are connected to the Umbraco.Bench project's two Umbraco MCP servers, umbraco and umbraco-editor
```

Then `npm run down`.

## Prompt 2 (Umbraco stopped)

```text
Spin up a simple blog site in this Umbraco project: a front page listing blog posts, and 2 blog posts about why MCP is awesome.

Rules:
- Follow AGENTS.md and UMBRACO-RULES.md.
- Build schema and content only through the two Umbraco MCP servers: no migration plans, Management API calls, uSync edits or database access.
  - umbraco: data types, document types, templates, media, domains.
  - umbraco-editor: pages, blocks, publishing.
- Build page bodies with the block grid: rich text, image and at least one more block type.
- Images: import photos from unsplash/ (see its README.md). Download nothing else.
- Stay inside this project folder. Don't read or write memory.
- Work autonomously. I won't answer questions. If a tool call fails, read the error, fix the input and try again; don't drop a requirement. If a tool keeps failing, say so in your report; never work around the MCP servers.

Umbraco is stopped, so the MCP servers won't work until you start it. Follow these steps in order:

1. Run "dotnet run" in Umbraco.Bench.Umbraco, in the background. While it boots, read AGENTS.md and UMBRACO-RULES.md and plan the types and blocks.
2. Wait until https://localhost:44317 answers, then check that one MCP call works.
3. Model (umbraco): the block element types, a Block Grid data type that allows them, then the front page and post document types, both with the block grid as their body, and their templates. File each type in its correct folder. Allow the front page type under Site Root (siteRoot's allowed children) and the post type under the front page type. Read each one back to check it saved.
4. Media (umbraco): create a media folder (leave out parentId for the root) and import the photos you need into it.
5. Content (umbraco-editor): create the front page under WWW, then the 2 posts under the front page. Pass the page's own properties (title, date, excerpt, listing image) as values: [{ alias, value }]. Add the body blocks with add-blockgrid-block: each post gets several paragraphs over at least 3 blocks, one of them an image. Before setting an image, call get-property-value-template for the media picker to get the value's shape. Publish every page, then check with get-page that each is published and has its values.
6. Domain (umbraco): put-document-domains on the front page (not WWW) with the domain "/".
7. Stop Umbraco (the dotnet process you started), then run "dotnet build" in Umbraco.Bench.Umbraco. Fix any errors.
8. Write the Razor views as AGENTS.md describes: a template per page type, an adapter per block in Views/Partials/blockgrid/Components/<alias>.cshtml, and a ViewComponent per block. Each adapter starts like the example in AGENTS.md: @inherits UmbracoViewPage<BlockGridItem<TheBlock>>, where TheBlock is the block's ModelsBuilder class, with @using Umbraco.Cms.Core.Models.Blocks.
9. Run "npm install" and "npm run build" in Umbraco.Bench.Frontend. Do it after step 8: Tailwind only includes the classes it finds in the views.
10. Run "dotnet build" again, then start Umbraco again in the background.
11. Fetch / and both posts with curl -k. Each must return 200, render every block, and contain no "Could not render component". A 404 means a page isn't published, has no template, or the domain is wrong. Fix it and check again.
12. Finish with a short report: what you built, how to view it, and anything that isn't working. Only claim what you checked.
```
