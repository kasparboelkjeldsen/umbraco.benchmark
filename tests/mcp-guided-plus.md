# Test: MCP Guided+

MCP Guided with a cheat sheet, for local models (2026-10-08, Gemma 4 26B A4B): Gemma's first MCP Guided attempt spent 80 minutes failing to create a Block Grid data type, swapping editorAlias and editorUiAlias and guessing folder ids. Same tool kit, steps and rubric as `mcp-guided.md`, plus the project's fixed ids and the fields of the schema calls (from a working Haiku 5.5 run), written without double quotes: Gemma copied a quoted example (group: "Content") into its native tool-call syntax, and LM Studio's parser then swallowed the rest of the call. Its runs get their own table: it is easier than MCP Guided.

Setup: `npm run setup -- mcp-guided-plus`, then `npm run up`. Headless: `npm run auto -- --test mcp-guided-plus --model <ids>`.

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

Cheat sheet (ids that are fixed in this project, and the fields that work; write every value as a normal string in your tool calls):
- Document type folders: Pages 0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4d1, Blocks 0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4d2. Site Root document type: 0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4e1.
- Built-in data types: Textstring 0cc0eba1-9960-42c9-bf9b-60e150b429ae, Textarea c6bac0dd-4ab9-45b1-8e30-e4b619ee5da3, Rich text ca90c950-0aff-4e72-b976-a30b1ac57dad, Image media picker ad9f0cf2-bda2-45d5-9ea1-a63cfc873fd3, Date picker 5046194e-4237-453c-a547-15db3a07c4e1. Use only these for block and page properties.
- Block: create-element-type with name, alias, icon and properties (each property: name, alias, dataTypeId, group set to Content). Then move-document-type with id and data.target.id set to the Blocks folder.
- Block Grid data type: create-data-type with name Blog Block Grid, editorAlias Umbraco.BlockGrid, editorUiAlias Umb.PropertyEditorUi.BlockGrid, and values: gridColumns 12, and blocks with one entry per block (contentElementTypeKey set to the block's id, allowAtRoot true, columnSpanOptions with columnSpan 12). No parentId.
- Page type: create-document-type with name, alias, icon, parentId set to the Pages folder, and properties (each: name, alias, dataTypeId, group set to Content). The block grid property uses the Block Grid data type's id.
- Templates and allowed children: get-document-type-by-id, then update-document-type with the whole object, changing only allowedTemplates, defaultTemplate or allowedDocumentTypes (each entry: documentType.id and sortOrder 0).
- Domain: put-document-domains with id set to the front page, and data: defaultIsoCode en-US, domains with one entry (domainName /, isoCode en-US).
- One tool call at a time.
- Shell: Bash here is Git Bash on Windows, which rewrites /F style flags into paths (taskkill /F becomes F:/). Start Umbraco once, in the background; if port 44317 is already in use, it is already running. To stop it, use PowerShell: Stop-Process -Name Umbraco.Bench.Umbraco -Force.

Umbraco is stopped, so the MCP servers won't work until you start it. Follow these steps in order:

1. Run "dotnet run" in Umbraco.Bench.Umbraco, in the background. While it boots, read AGENTS.md and UMBRACO-RULES.md and plan the types and blocks.
2. Wait until https://localhost:44317 answers, then check that one MCP call works.
3. Model (umbraco): the block element types, a Block Grid data type that allows them, then the front page and post document types, both with the block grid as their body, and their templates. File each type in its correct folder. Allow the front page type under Site Root (siteRoot's allowed children) and the post type under the front page type. Read each one back to check it saved.
4. Media (umbraco): create a media folder (leave out parentId for the root) and import the photos you need into it.
5. Content (umbraco-editor): create the front page under WWW, then the 2 posts under the front page. Pass the page's own properties (title, date, excerpt, listing image) as values: [{ alias, value }]. Add the body blocks with add-blockgrid-block: each post gets several paragraphs over at least 3 blocks, one of them an image. Before setting an image, call get-property-value-template for the media picker to get the value's shape. Publish every page, then check with get-page that each is published and has its values.
6. Domain (umbraco): put-document-domains on the front page (not WWW) with the domain /.
7. Stop Umbraco (the dotnet process you started), then run "dotnet build" in Umbraco.Bench.Umbraco. Fix any errors.
8. Write the Razor views as AGENTS.md describes: a template per page type, an adapter per block in Views/Partials/blockgrid/Components/<alias>.cshtml, and a ViewComponent per block. Each adapter starts like the example in AGENTS.md: @inherits UmbracoViewPage<BlockGridItem<TheBlock>>, where TheBlock is the block's ModelsBuilder class, with @using Umbraco.Cms.Core.Models.Blocks.
9. Run "npm install" and "npm run build" in Umbraco.Bench.Frontend. Do it after step 8: Tailwind only includes the classes it finds in the views.
10. Run "dotnet build" again, then start Umbraco again in the background.
11. Fetch / and both posts with curl -k. Each must return 200, render every block, and contain no "Could not render component". A 404 means a page isn't published, has no template, or the domain is wrong. Fix it and check again.
12. Finish with a short report: what you built, how to view it, and anything that isn't working. Only claim what you checked.
```
