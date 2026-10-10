---
name: umbraco-dev-loop
description: Start, stop, build and check a local Umbraco site, in the right order for MCP work, ModelsBuilder and the frontend build. Use before calling the Umbraco MCP servers, when they fail to connect, when Umbraco won't start or answers on the wrong port, and when running dotnet or npm builds on Windows with Git Bash.
---

# Umbraco dev loop

## Start

- Run `dotnet run` in the web project folder (the one with the .csproj and `Properties/launchSettings.json`), in the background. **Add no flags.** The launch profile sets the URL (for example https://localhost:44317) and the Development environment.
  - `--no-launch-profile` serves http://localhost:5000 in Production, where the MCP servers find nothing.
  - The MCP servers use the address in `.mcp.json` (`UMBRACO_BASE_URL`). Read it if unsure.
- Wait until the site answers before any MCP call. Poll with `curl -k -s -o /dev/null -w %{http_code} <url>` every few seconds; a cold boot with a restore takes 1–3 minutes. Then make one cheap read call (for example `get-document-type-root`) to prove MCP works.
- If a background task gets killed for running too long, Umbraco dies with it. Restart it the same way.

## Stop

- Git Bash: `powershell -Command Stop-Process -Name <ProjectName> -Force`.
- Never `taskkill /F`, because Git Bash turns `/F` into a path.
- Stop Umbraco before `dotnet build`, or the build fails on locked DLLs.

## Order of work

1. Start Umbraco, then build the schema and content through MCP (see the umbraco-schema and umbraco-content skills).
2. Stop Umbraco, then run `dotnet build`. ModelsBuilder (SourceCodeAuto/SourceCodeManual) writes typed models to `Models/ModelsBuilder/`. Use their class and property names in Razor, and read the generated files rather than guessing them.
3. Write the views (see the umbraco-blockgrid-views skill).
4. Build the frontend **after** the views exist: `npm install` and `npm run build` in the frontend project. Tailwind only keeps the classes it finds in the views.
5. Run `dotnet build` again, then start Umbraco again the same way.
6. Check every page with `curl -k`: 200, every block present, no escaped `&lt;p&gt;`, no `Could not render component`.
   - A 404 means the page isn't published, has no template, or the domain is on the wrong node.

## Windows / Git Bash

- Windows programs want `C:/code/...` paths, not `/c/code/...`.
- Make GUIDs with `powershell -Command [guid]::NewGuid()`. `/proc/sys/kernel/random/uuid` doesn't exist here.
- Stay inside the project, and keep temporary files inside it too: no `/tmp`.
