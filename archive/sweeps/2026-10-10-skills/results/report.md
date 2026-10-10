# Umbraco benchmark — model comparison

Generated 10/10/2026, 15:50:42

## Test: MCP Skills

### Time

| Phase | Glm 5.3 Flash |
| --- | ---: |
| Prompt 1: verify MCP | 0:13 |
| Boot, read rules, plan → first type created | 0:53 |
| Content modeling | 0:49 |
| Content: media, pages, publish | 1:29 |
| Stop, build, Razor, restart | 2:25 |
| Checking the result and final report | 0:47 |
| Total from first prompt | 6:37 |
| Blog prompt only | 6:24 |

### Tokens

| Tokens | Glm 5.3 Flash |
| --- | ---: |
| API requests | 74 |
| Fresh input | 78,308 |
| Cache creation | 0 |
| Cache read | 4,713,984 |
| Output | 29,541 |
| &nbsp;&nbsp;of which thinking | 12,619 |
| Total | 4,821,833 |
| Total excluding cache reads | 107,849 |

### Tokens by activity

| Activity | Glm 5.3 Flash |
| --- | ---: |
| Umbraco MCP | 803,137 (17%) |
| Coding: site (views, components, models) | 957,187 (20%) |
| Build, run & verify | 84,797 (2%) |
| Base context & reasoning | 2,976,711 (62%) |

### Tokens by activity, excluding cache reads

| Activity | Glm 5.3 Flash |
| --- | ---: |
| Umbraco MCP | 27,159 (25%) |
| Coding: site (views, components, models) | 34,778 (32%) |
| Build, run & verify | 7,091 (7%) |
| Base context & reasoning | 38,820 (36%) |

### Tool calls

| Tool | Glm 5.3 Flash |
| --- | ---: |
| Shell (Bash) | 21 |
| Umbraco MCP | 58 |
| Read / Grep / Glob | 4 |
| Edit / Write | 35 |
| Background task control | 1 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 17 / 41 |
| Total tool calls | 119 |
| Tool calls per API request | 1.61 |
| Failed tool calls | 2 |
| Files written with heredocs | 0 |
| dotnet build (failed) | 3 (2) |

### Grade

| Category | Glm 5.3 Flash |
| --- | ---: |
| It works (/35) | 35 |
| Content modeling (/25) | 25 |
| Code architecture & conventions (/25) | 25 |
| Content & presentation (/10) | 7 |
| Process & honesty (/5) | 4 |
| Total | 96/100 |
| Automated checks passed | 43/43 |
| Graded by | Opus 5.5 (high) |

#### Runs

- **Glm 5.3 Flash** — `2026-10-10_1540_mcp-skills_glm-5.3-flash-high`, model `z-ai/glm-5.3-flash`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A clean, convention-perfect MCP-built blog: five block types rendered through adapters and ViewComponents, a block-grid front page with a dynamic post list, and two published posts with real date/excerpt properties and provided Unsplash photos. Lost points only on thin post copy, small presentation flaws (duplicated post title, unspaced paragraphs) and writing views before the stop/build step.
