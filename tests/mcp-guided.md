# Test: MCP Guided

The MCP test with a shorter, more direct prompt for small models: the same site, the same rules, the same channel (the Umbraco MCP server) and the same rubric, but the prompt ends with the order of operations as explicit numbered steps. It is the same exam as `mcp.md`, so scores compare; the difference is how much of the process the model has to work out by itself.

Setup: `npm run setup -- mcp-guided`, then `npm run up`. Headless: `npm run auto -- --test mcp-guided --model <ids>`.

## Prompt 1 (Umbraco running)

```text
verify you are connected to the Umbraco.Bench project's Umbraco MCP server
```

Then `npm run down`.

## Prompt 2 (Umbraco stopped)

```text
Spin up a simple blog site in this Umbraco project: a front page listing blog posts, and 2 blog posts about why MCP is awesome.

Rules:
- Follow AGENTS.md and UMBRACO-RULES.md.
- Build schema and content only through the Umbraco MCP server: no migration plans, Management API calls, uSync edits or database access.
- Build page bodies with the block grid: rich text, image and at least one more block type.
- Images: import photos from unsplash/ (see its README.md). Download nothing else.
- Stay inside this project folder. Don't read or write memory.
- Work autonomously. I won't answer questions.

Umbraco is stopped, so the MCP server won't work until you start it. Follow these steps in order:

1. Run "dotnet run" in Umbraco.Bench.Umbraco, in the background. While it boots, read AGENTS.md and UMBRACO-RULES.md and plan the types and blocks.
2. Wait until https://localhost:44317 answers, then check that one MCP call works.
3. Model: data types, blocks (element types), document types and templates, each type in its correct folder. Read each one back to check it saved.
4. Media: import the photos you need into a media folder.
5. Content: create the front page under WWW with the domain "/", then the 2 posts under it. Publish everything. Read the posts back to check the block grid saved.
6. Stop Umbraco (the dotnet process you started).
7. Run "dotnet build" in Umbraco.Bench.Umbraco. Fix any errors.
8. Write the Razor views as AGENTS.md describes: a template per page type, an adapter per block in Views/Partials/blockgrid/Components/<alias>.cshtml, and a ViewComponent per block.
9. Run "npm install" and "npm run build" in Umbraco.Bench.Frontend. Do it after step 8: Tailwind only includes the classes it finds in the views.
10. Run "dotnet build" again, then start Umbraco again in the background.
11. Fetch / and both posts with curl -k. Each must return 200, render every block, and contain no "Could not render component". Fix what's broken and check again.
12. Finish with a short report: what you built, how to view it, and anything that isn't working. Only claim what you checked.
```
