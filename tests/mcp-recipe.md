# Test: MCP Recipe

MCP Guided turned into a verified recipe, to see what our setup needs for open-weight and budget models to get through reliably (2026-10-10). Same scaffold, rules, rubric and slim tool kit as `mcp-guided.md` (dev MCP server for schema, media and the domain; the patched editor MCP server for pages, blocks and publishing). On top of that, the prompt answers every question the failed runs of 2026-10-07/09 got stuck on:

| Failure seen | Runs | What the recipe adds |
|---|---|---|
| Block grid values with empty or wrong keys, dropped on save | GLM 5.3 Flash, Mistral Large 4, DeepSeek V4 Flash | Blocks only through the editor server's add-blockgrid-block (as in MCP Guided) |
| Block Grid data type created with no allowed blocks | Mistral Large 4, DeepSeek V4 Flash | The data type's fields, and a read-back that must list the blocks |
| Tool arguments sent as JSON strings | DeepSeek V4 Flash, Haiku 4.5 | Arguments are objects and arrays, never strings of JSON |
| update-document-type sent half an object | Gemma 4, GLM 5.3 Flash | Read the whole object, change three fields, send it all back |
| Template files moved, copied or given a type that doesn't exist | Haiku 4.5, GLM 5.3 Flash, Gemma 4 | Edit Views/<alias>.cshtml in place, with the exact first lines |
| Rich text printed escaped, no stylesheet, block grid CSS overridden | Haiku 4.5, GLM 5.3 Flash | Html.Raw for rich text, a full HTML page linking ~/dist/site.css, leave .umb-block-grid alone |
| Front page without a post listing | Haiku 4.5 | The listing is spelled out |
| Decompiling, reflecting over DLLs, reading MCP server sources, the database or the web | Mistral Large 4, GLM 5.3 Flash, DeepSeek V4 Flash, Haiku 4.5 | Forbidden, with the promise that this route is verified and the errors say what to fix |
| Git Bash traps (taskkill /F, /c/ paths) | Gemma 4, Mistral Large 4 | Shell notes |
| Timeouts with no report | Mistral, GLM, Gemma, DeepSeek | After 5 failed tries, move on; always write the report |

Version 2 (2026-10-10, after the first 5 recipe runs in archive/sweeps/2026-10-10-recipe, all graded 94.5–99 and rated honest) fixes what those runs still tripped over:

| Snag in version 1 | Runs | Version 2 |
|---|---|---|
| publish-page with includeDescendants returned Publish cancelled (the editor server asks for an approval a headless client declines, and it skips never-published pages anyway) | all 5 | Publish the front page, then each post, one call each |
| Umbraco started with --no-launch-profile, so it served port 5000 and the MCP servers found nothing | Mistral Large 4 (12 minutes lost) | The exact start command, and why |
| siteRoot not allowed to have blogFrontPage, so create-page failed with Operation not permitted | GLM 5.3 Flash (both runs) | Spelled out in the cheat sheet and step 3 |
| ViewComponent classes not ending in ViewComponent, so MVC didn't find them | GLM 5.3 Flash | The class name rule |
| /proc/sys/kernel/random/uuid for GUIDs (not on Windows) | Haiku 5.5 | How to make a GUID |

Not part of the real benchmark. The cheat sheet has no double quotes: Gemma copied quoted examples into its native tool-call syntax and LM Studio's parser swallowed the rest of the call (see MCP Guided+).

Setup: `npm run setup -- mcp-recipe`, then `npm run up`. Headless: `npm run auto -- --test mcp-recipe --model <ids>`.

## Prompt 1 (Umbraco running)

```text
verify you are connected to the Umbraco.Bench project's two Umbraco MCP servers, umbraco and umbraco-editor
```

Then `npm run down`.

## Prompt 2 (Umbraco stopped)

```text
Spin up a simple blog site in this Umbraco project: a front page listing blog posts, and 2 blog posts about why MCP is awesome.

This route has been run end to end on this exact project and it works. Everything you need is in this prompt, AGENTS.md and the tools' error messages.

Rules:
- Follow AGENTS.md and UMBRACO-RULES.md.
- Build schema and content only through the two Umbraco MCP servers. umbraco: data types, document types, templates, media, domains. umbraco-editor: pages, blocks, publishing.
- Never decompile, reflect over, grep or strings Umbraco's assemblies or the MCP servers' files, never read the database, never call the Management API yourself, never write migrations or uSync files, and don't search the web. None of that is needed: when a call fails, its error message says what to fix.
- Tool arguments are JSON objects and arrays. Never pass a string that contains JSON.
- Images: import photos from unsplash/ (see its README.md). Download nothing else.
- Stay inside this project folder and write no files outside it (no /tmp). Don't read or write memory.
- Work autonomously. I won't answer questions. If one step still fails after 5 tries, note what failed, go on with the next step, and say so in your report. Always end with the report.
- Shell: Bash here is Git Bash on Windows. Use paths like C:/code/... for Windows programs, never taskkill /F (Git Bash turns /F into a path). Stop Umbraco with: powershell -Command Stop-Process -Name Umbraco.Bench.Umbraco -Force. Make a new GUID with: powershell -Command [guid]::NewGuid()

Cheat sheet (ids that are fixed in this project, and the fields that work):
- Document type folders: Pages 0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4d1, Blocks 0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4d2. Site Root document type: 0b5f1e5b-0a9a-4c4f-8e8c-1d01b2a3c4e1.
- Built-in data types, the only ones you need besides your Block Grid: Textstring 0cc0eba1-9960-42c9-bf9b-60e150b429ae, Textarea c6bac0dd-4ab9-45b1-8e30-e4b619ee5da3, Rich text ca90c950-0aff-4e72-b976-a30b1ac57dad, Image media picker ad9f0cf2-bda2-45d5-9ea1-a63cfc873fd3, Date picker 5046194e-4237-453c-a547-15db3a07c4e1.
- Block (create-element-type): name, alias, icon, properties (each: name, alias, dataTypeId, tab Content). Blocks: richTextBlock (text: Rich text), imageBlock (image: Image media picker, caption: Textstring), quoteBlock (quote: Textarea, attribution: Textstring). Then move-document-type with id and data.target.id set to the Blocks folder.
- Block Grid data type (create-data-type): name Blog Block Grid, editorAlias Umbraco.BlockGrid, editorUiAlias Umb.PropertyEditorUi.BlockGrid, values: gridColumns 12, and blocks with one entry per block (contentElementTypeKey set to the block's id, allowAtRoot true, allowInAreas true). No parentId. Read it back with get-data-type: its blocks value must list all three blocks.
- Page type (create-document-type): name, alias, icon, parentId the Pages folder, properties (each: name, alias, dataTypeId, tab Content). blogFrontPage: title (Textstring), intro (Textarea), body (Blog Block Grid). blogPost: title (Textstring), publishDate (Date picker), excerpt (Textarea), listingImage (Image media picker), body (Blog Block Grid).
- Template (create-template): name and alias only (alias blogFrontPage, blogPost). Umbraco writes Views/<alias>.cshtml; you fill in that same file later.
- Templates and allowed children (update-document-type): get-document-type-by-id, then send back the whole object you got, changing only allowedTemplates (a list with the template id), defaultTemplate (the template id) and allowedDocumentTypes (each entry: documentType.id and sortOrder 0). siteRoot allows blogFrontPage (without it, creating the front page fails with Operation not permitted); blogFrontPage allows blogPost.
- Media (create-media-multiple): sourceType filePath, parentId your media folder, files (each: name, filePath the absolute path of the photo in unsplash/, mediaTypeName Image).
- Page (umbraco-editor create-page): name, documentTypeId, parentId, values (each: alias, value). A media picker value is a list with one entry: key a new random GUID, mediaKey the photo's id, mediaTypeAlias Image, crops an empty list, focalPoint null. A date is like 2026-10-01T09:00:00.
- Block on a page (umbraco-editor add-blockgrid-block): id the page, propertyAlias body, contentTypeKey the block's id, values (each: alias, value). A rich text value is an object: markup the HTML, and blocks an object with layout an empty object, and contentData, settingsData and expose empty lists. An image value is a media picker value as above.
- Publish (umbraco-editor publish-page): the front page first, then each post, one call per page, without includeDescendants (that option waits for an approval nobody can give here, and skips pages that were never published). Check each page with get-page.
- Domain (put-document-domains): id the front page, data: defaultIsoCode en-US, domains with one entry (domainName /, isoCode en-US).

Umbraco is stopped, so the MCP servers won't work until you start it. Follow these steps in order:

1. Start Umbraco in the background with exactly: cd Umbraco.Bench.Umbraco && dotnet run. Add no flags: its launch profile serves https://localhost:44317 in Development, the only address the MCP servers use. While it boots, read AGENTS.md and UMBRACO-RULES.md.
2. Wait until https://localhost:44317 answers, then check that one MCP call works.
3. Model (umbraco), from the cheat sheet: the three blocks (moved into Blocks), the Blog Block Grid data type (read it back), the two templates, the two page types, then templates and allowed children with update-document-type, including siteRoot allowing blogFrontPage. Read each one back.
4. Media (umbraco): create a media folder without a parentId, then import 4 or more photos into it.
5. Content (umbraco-editor): create the front page under WWW (find WWW with list-children or search-content), then the 2 posts under the front page, with their values. Give each post several paragraphs over at least 4 blocks: rich text, an image, more rich text, a quote. Give the front page an intro and one rich text block. Then publish the front page, then each post, and check.
6. Domain (umbraco): / on the front page, not on WWW.
7. Stop Umbraco, then run dotnet build in Umbraco.Bench.Umbraco. ModelsBuilder has now generated the models in Models/ModelsBuilder/ (namespace Umbraco.Bench.Umbraco.Models); use their class and property names.
8. Write the Razor, as AGENTS.md describes:
   - Fill in Views/blogFrontPage.cshtml and Views/blogPost.cshtml in place; never move, rename or copy them. Each starts with @using Umbraco.Bench.Umbraco.Models and @inherits UmbracoViewPage<BlogFrontPage> (or <BlogPost>), sets Layout = null, and is a whole HTML page (doctype, head with a title and <link rel=stylesheet href=~/dist/site.css asp-append-version=true>, body). There is no shared layout in this scaffold.
   - Render the body with @await Html.GetBlockGridHtmlAsync(Model, body) (the property alias in quotes).
   - The front page also lists its posts: Model.Children<BlogPost>(), each with a link (post.Url()), title, date, excerpt and listing image (GetCropUrl).
   - One adapter per block in Views/Partials/blockgrid/Components/<alias>.cshtml, starting with @using Umbraco.Cms.Core.Models.Blocks, @using Umbraco.Bench.Umbraco.Models and @inherits UmbracoViewPage<BlockGridItem<RichTextBlock>> (the block's class). It maps Model.Content to a plain model in Models/Blocks/ and calls @await Component.InvokeAsync with it; no markup.
   - One ViewComponent per block, a class whose name ends in ViewComponent (RichTextViewComponent, or MVC won't find it), with its view in Views/Shared/Components/RichText/Default.cshtml (the name without ViewComponent). Rich text: the adapter passes Model.Content.Text?.ToHtmlString() as a string, and the view prints it with @Html.Raw(Model.Html), or the tags show up as text.
   - Style with Tailwind classes in the views. Don't add CSS for the umb-block-grid classes; the scaffold's grid partials already lay the blocks out.
9. Run npm install and npm run build in Umbraco.Bench.Frontend, after the views exist (Tailwind only keeps classes it finds in them).
10. Run dotnet build again, then start Umbraco again in the background, the same way as in step 1.
11. Fetch / and both posts with curl -k. Each must return 200, show every block, show no literal <p> tags, and contain no Could not render component. A 404 means a page isn't published, has no template, or the domain is wrong. Fix it and check again.
12. Finish with a short report: what you built, how to view it, and anything that isn't working. Only claim what you checked.
```
