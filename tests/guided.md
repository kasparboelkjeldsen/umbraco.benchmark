# Test: MCP guided (Editor)

Not to be confused with `mcp-guided.md` (the plain MCP test with numbered steps). This is the MCP test made kinder still, for models that can't find their own way: two Umbraco MCP servers cut down to the 44 tools a
blog needs (~16k tokens instead of 160 tools and ~37k), Umbraco's Editor server for pages and blocks (its
`add-blockgrid-block` writes the block grid JSON that small models kept getting wrong), and a prompt that spells out the
order of work and the traps earlier runs fell into. Same task, same grader; its runs are reported as their own test.

Setup: `npm run setup -- guided`, then `npm run up`. The runner does both (`npm run auto -- --test guided`).

## Prompt 1 (Umbraco running)

```text
verify you are connected to both of the Umbraco.Bench project's Umbraco MCP servers, umbraco and umbraco-editor, by calling one read-only tool on each
```

Then `npm run down`.

## Prompt 2 (Umbraco stopped)

```text
Adhering to AGENTS.md and UMBRACO-RULES.md, your job is to demonstrate the local capabilities of the Umbraco MCP servers.

Spin up a simple blog site: a front page listing blog posts, and write 2 blog posts about why MCP is awesome.

I have stopped Umbraco, which means the MCP servers won't work until it is running again. Use "dotnet run" in the Umbraco project to start Umbraco before trying anything through them.

You have two Umbraco MCP servers:
- umbraco: document types, element types, data types, templates, the media library (importing photos) and domains.
- umbraco-editor: pages, blocks and publishing. Use its add-blockgrid-block to put blocks on a page; never write block grid JSON by hand.

Follow these steps in order:
1. Templates first: create a template for the front page and one for a blog post (create-template), so every page is born with a template.
2. Content modeling: element types for your blocks in the Blocks folder, page types in the Pages folder, one Block Grid data type allowing your blocks, and allowed children (front page under siteRoot, posts under the front page). Set each page type's allowed and default template with update-document-type.
3. Photos: import the Unsplash photos in the unsplash/ folder (see its README.md) into a media folder with create-media-multiple. Don't download other images.
4. Pages: create the front page under the existing WWW node, then the 2 posts under the front page. Give the posts real content as blocks with add-blockgrid-block, using different photos.
5. Domain: put the domain "/" on the front page (put-document-domains on the front page, not on WWW).
6. Publish every page, then check each one with get-page that it is published and has its template.
7. Stop Umbraco, then write the Razor views following AGENTS.md: pages render blocks with Html.GetBlockGridHtmlAsync, each block has an adapter partial in Views/Partials/blockgrid/Components/<alias>.cshtml that maps to a plain model and calls a ViewComponent, and all markup lives in the ViewComponent's view. Block adapters need "@using Umbraco.Cms.Core.Models.Blocks" for BlockGridItem<T>; it isn't in _ViewImports. Style with Tailwind through the frontend project's build (Umbraco.Bench.Frontend), not a CDN, and keep the scaffold's layout.
8. Build, start Umbraco and load the front page and both posts over HTTPS. Fix what doesn't render.

If a page answers 404, it usually means it isn't published, it was published before it had a template (publish it again), or the front page has no "/" domain.

If a call fails, read the error and retry with a fix; don't drop a requirement to get past it. Never read or write Umbraco's database directly, and don't decompile Umbraco: the MCP servers, AGENTS.md and the error messages are your sources.

Use the time while Umbraco is starting to plan. You have ~30 seconds.

Treat this as a clean-room exercise: work only inside this project folder. Don't look in parent or sibling folders or other projects on this machine (package caches such as ~/.nuget are fine), and don't read or write any memory.

Work autonomously; I won't be answering questions during this task. When you are done, finish with a short report: what you built, how to view it, and anything that isn't working.
```
