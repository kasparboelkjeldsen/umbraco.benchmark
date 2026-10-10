# Test: MCP Skills

The MCP test's own prompt, almost word for word. The recipe's knowledge ships in the project instead of the prompt (2026-10-10): Claude Code skills in `Umbraco.Bench/.claude/skills/`, and the guardrails in `Umbraco.Bench/.claude/CLAUDE.md`, which is always loaded. It uses the same slim kit as MCP Guided and MCP Recipe: the dev MCP server for schema, media and the domain, and the patched editor MCP server for pages, blocks and publishing. The checks and rubric are the same, and it gets its own table. Not part of the real benchmark.

The question it answers: does the knowledge that got budget models through MCP Recipe (archive/sweeps/2026-10-10-recipe) still work when the model has to fetch it itself? The skills come from C:\code\umbraco-mcp-skills (copied into tests/mcp-skills/). Setup installs them for this test only, and removes them for every other test. `.claude/` is never part of a run's diff, so they don't count as the model's work.

Which skills a run loaded shows in its transcript as Skill tool calls.

Setup: `npm run setup -- mcp-skills`, then `npm run up`. Headless: `npm run auto -- --test mcp-skills --model <ids>`.

## Prompt 1 (Umbraco running)

```text
verify you are connected to the Umbraco.Bench project's two Umbraco MCP servers, umbraco and umbraco-editor
```

Then `npm run down`.

## Prompt 2 (Umbraco stopped)

```text
Adhering to AGENTS.md and UMBRACO-RULES.md, your job is to demonstrate the local capabilities of the project's two Umbraco MCP servers, umbraco and umbraco-editor.

Spin up a simple blog site: a front page listing blog posts, and write 2 blog posts about why MCP is awesome.

Take care to build everything with blocks and the block grid. Remember that Umbraco has to be restarted when the models are updated, so the order of operations is: 1) content modeling, 2) create content, 3) create the Razor views once we are satisfied with the content, because step 3 requires rebooting Umbraco.

I have stopped Umbraco, which means the MCP servers won't work until it is running again. Use "dotnet run" in the Umbraco project to start Umbraco before trying anything through the MCP servers.

Always use the MCP servers to create content. Do not write any migration plans as part of this test.

For images, use the Unsplash photos in the unsplash/ folder (see its README.md) and import them into the media library. Don't download other images.

Use the time while Umbraco is starting to plan the content modeling. You have ~30 seconds.

Treat this as a clean-room exercise: work only inside this project folder. Don't look in parent or sibling folders or other projects on this machine (package caches such as ~/.nuget are fine), and don't read or write any memory.

Work autonomously; I won't be answering questions during this task. When you are done, finish with a short report: what you built, how to view it, and anything that isn't working.
```
