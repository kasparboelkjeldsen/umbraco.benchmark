# Umbraco benchmark — model comparison

Generated 07/10/2026, 20:30:24

## Test: MCP

### Time

| Phase | Haiku 5.5 |
| --- | ---: |
| Prompt 1: verify MCP | 0:05 |
| Boot, read rules, plan → first type created | 0:45 |
| Content modeling | 0:41 |
| Content: media, pages, publish | 1:48 |
| Stop, build, Razor, restart | 1:11 |
| Checking the result and final report | 0:30 |
| Total from first prompt | 5:00 |
| Blog prompt only | 4:55 |

### Tokens

| Tokens | Haiku 5.5 |
| --- | ---: |
| API requests | 49 |
| Fresh input | 98 |
| Cache creation | 121,425 |
| Cache read | 4,735,997 |
| Output | 56,271 |
| &nbsp;&nbsp;of which thinking | 29,639 |
| Total | 4,913,791 |
| Total excluding cache reads | 177,794 |

### Tokens by activity

| Activity | Haiku 5.5 |
| --- | ---: |
| Umbraco MCP | 2,166,594 (44%) |
| Coding: site (views, components, models) | 1,284,601 (26%) |
| Build, run & verify | 117,754 (2%) |
| Other tools | 8,857 (0%) |
| Base context & reasoning | 1,335,986 (27%) |

### Tokens by activity, excluding cache reads

| Activity | Haiku 5.5 |
| --- | ---: |
| Umbraco MCP | 81,271 (46%) |
| Coding: site (views, components, models) | 71,149 (40%) |
| Build, run & verify | 18,526 (10%) |
| Other tools | 782 (0%) |
| Base context & reasoning | 6,067 (3%) |

### Tool calls

| Tool | Haiku 5.5 |
| --- | ---: |
| Shell (Bash) | 20 |
| Umbraco MCP | 34 |
| Read / Grep / Glob | 6 |
| Edit / Write | 21 |
| ToolSearch | 4 |
| Background task control | 2 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 10 / 24 |
| Total tool calls | 87 |
| Tool calls per API request | 1.78 |
| Failed tool calls | 1 |
| Files written with heredocs | 0 |
| dotnet build (failed) | 4 (2) |

### Grade

| Category | Haiku 5.5 |
| --- | ---: |
| It works (/35) | 35 |
| Content modeling (/25) | 24 |
| Code architecture & conventions (/25) | 23 |
| Content & presentation (/10) | 4 |
| Process & honesty (/5) | 4 |
| Total | 90/100 |
| Automated checks passed | 43/43 |
| Graded by | Opus 5.5 (high) |

#### Runs

- **Haiku 5.5** — `2026-10-07_2021_mcp_haiku-5.5-high`, model `claude-haiku-5-5`, effort high, Claude Code 2.1.293, headless (npm run auto, auto)
  - A complete MCP-built blog: three blocks (hero, rich text, image) in one shared block grid, a front page and two posts. It has textbook adapter → ViewComponent architecture, and all 43 automated checks pass. It is let down by an unstyled site (Tailwind was compiled before the views existed) and by short posts.
