# Umbraco benchmark — model comparison

Generated 10/10/2026, 07:38:51

## Test: MCP Recipe

### Time

| Phase | Haiku 5.5 | Mistral Large 4 | Glm 5.3 Flash |
| --- | ---: | ---: | ---: |
| Prompt 1: verify MCP | 0:06 | 0:12 | 0:04 |
| Boot, read rules, plan → first type created | 0:21 | 14:48 | 0:11 |
| Content modeling | 0:43 | 2:27 | 0:25 |
| Content: media, pages, publish | 1:28 | 3:09 | 1:02 |
| Stop, build, Razor, restart | 1:58 | 4:21 | 2:10 |
| Checking the result and final report | 0:33 | 1:33 | 0:18 |
| Total from first prompt | 5:09 | 26:29 | 4:12 |
| Blog prompt only | 5:03 | 26:18 | 4:07 |

### Tokens

| Tokens | Haiku 5.5 | Mistral Large 4 | Glm 5.3 Flash |
| --- | ---: | ---: | ---: |
| API requests | 52 | 63 | 72 |
| Fresh input | 104 | 642,426 | 90,730 |
| Cache creation | 139,348 | 0 | 0 |
| Cache read | 5,027,594 | 4,995,980 | 4,417,856 |
| Output | 55,444 | 58,962 | 26,825 |
| &nbsp;&nbsp;of which thinking | 29,310 | 38,468 | 11,957 |
| Total | 5,222,490 | 5,697,368 | 4,535,411 |
| Total excluding cache reads | 194,896 | 701,388 | 117,555 |

### Tokens by activity

| Activity | Haiku 5.5 | Mistral Large 4 | Glm 5.3 Flash |
| --- | ---: | ---: | ---: |
| Umbraco MCP | 2,723,163 (52%) | 2,314,807 (41%) | 1,149,459 (25%) |
| Coding: site (views, components, models) | 802,128 (15%) | 750,262 (13%) | 676,578 (15%) |
| Build, run & verify | 184,410 (4%) | 1,406,976 (25%) | 77,381 (2%) |
| Base context & reasoning | 1,512,790 (29%) | 1,225,323 (22%) | 2,631,992 (58%) |

### Tokens by activity, excluding cache reads

| Activity | Haiku 5.5 | Mistral Large 4 | Glm 5.3 Flash |
| --- | ---: | ---: | ---: |
| Umbraco MCP | 95,397 (49%) | 225,892 (32%) | 35,083 (30%) |
| Coding: site (views, components, models) | 56,714 (29%) | 252,129 (36%) | 34,118 (29%) |
| Build, run & verify | 23,915 (12%) | 143,990 (21%) | 7,114 (6%) |
| Base context & reasoning | 18,870 (10%) | 79,377 (11%) | 41,239 (35%) |

### Tool calls

| Tool | Haiku 5.5 | Mistral Large 4 | Glm 5.3 Flash |
| --- | ---: | ---: | ---: |
| Shell (Bash) | 18 | 35 | 27 |
| Shell (PowerShell) | 1 | 0 | 0 |
| Umbraco MCP | 59 | 57 | 48 |
| Read / Grep / Glob | 4 | 16 | 5 |
| Edit / Write | 14 | 16 | 20 |
| ToolSearch | 2 | 0 | 0 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 23 / 36 | 21 / 36 | 11 / 37 |
| Total tool calls | 98 | 124 | 100 |
| Tool calls per API request | 1.88 | 1.97 | 1.39 |
| Failed tool calls | 4 | 2 | 2 |
| Files written with heredocs | 0 | 0 | 0 |
| dotnet build (failed) | 3 (1) | 4 (2) | 5 (1) |

### Grade

| Category | Haiku 5.5 | Mistral Large 4 | Glm 5.3 Flash |
| --- | ---: | ---: | ---: |
| It works (/35) | 35 | 35 | 35 |
| Content modeling (/25) | 24 | 25 | 25 |
| Code architecture & conventions (/25) | 24.5 | 24.5 | 25 |
| Content & presentation (/10) | 6.5 | 9 | 9 |
| Process & honesty (/5) | 4.5 | 5 | 4.5 |
| Total | 94.5/100 | 98.5/100 | 98.5/100 |
| Automated checks passed | 43/43 | 43/43 | 43/43 |
| Graded by | Opus 5.5 (high) | Opus 5.5 (high) | Opus 5.5 (high) |

#### Runs

- **Haiku 5.5** — `2026-10-10_0630_mcp-recipe_haiku-5.5-high`, model `claude-haiku-5-5`, effort high, Claude Code 2.1.293, headless (npm run auto, auto)
  - A complete, working MCP-built blog: front page with a styled card listing and two block-grid posts, with schema, block pipeline and conventions done by the book. The main weakness is the content itself, which is short, and the 'three reasons' post only gives two.
- **Mistral Large 4** — `2026-10-10_0700_mcp-recipe_mistral-large-4-high`, model `mistralai/mistral-large-4-0`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A clean, fully working MCP-built blog: three well-formed blocks in one custom block grid, front page and post types correctly filed and wired, both posts rendering every block through the textbook adapter -> ViewComponent pipeline, and a tidy Tailwind design. Only nits: duplicated HTML shells per page and short, self-referential posts.
- **Glm 5.3 Flash** — `2026-10-10_0730_mcp-recipe_glm-5.3-flash-high`, model `z-ai/glm-5.3-flash`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A clean, fully working MCP-built blog: three well-formed blocks on one custom block grid, a front page of image/date/excerpt cards and two published posts, rendered through the prescribed adapter -> plain model -> ViewComponent pipeline with polished Tailwind styling. The only blemishes are fairly short posts and a skipped siteRoot allowed-children step that it fixed reactively.
