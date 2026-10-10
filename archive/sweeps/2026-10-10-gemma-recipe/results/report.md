# Umbraco benchmark — model comparison

Generated 10/10/2026, 10:59:57

## Test: MCP Recipe

### Time

| Phase | Gemma 4 26B A4B |
| --- | ---: |
| Prompt 1: verify MCP | 2:04 |
| Boot, read rules, plan → first type created | 3:34 |
| Content modeling | 3:15 |
| Content: media, pages, publish | 0:00 |
| Stop, build, Razor, restart | 25:00 |
| Checking the result and final report | 1:15 |
| Total from first prompt | 35:07 |
| Blog prompt only | 33:03 |

### Tokens

| Tokens | Gemma 4 26B A4B |
| --- | ---: |
| API requests | 81 |
| Fresh input | 67,336 |
| Cache creation | 0 |
| Cache read | 4,355,895 |
| Output | 30,085 |
| &nbsp;&nbsp;of which thinking | 0 |
| Total | 4,453,316 |
| Total excluding cache reads | 97,421 |
| Est. API-equivalent cost (USD) | $3.27 |

### Tokens by activity

| Activity | Gemma 4 26B A4B |
| --- | ---: |
| Umbraco MCP | 1,870,868 (42%) |
| Build, run & verify | 84,136 (2%) |
| Base context & reasoning | 2,498,312 (56%) |

### Tokens by activity, excluding cache reads

| Activity | Gemma 4 26B A4B |
| --- | ---: |
| Umbraco MCP | 63,835 (66%) |
| Build, run & verify | 1,633 (2%) |
| Base context & reasoning | 31,953 (33%) |

### Tool calls

| Tool | Gemma 4 26B A4B |
| --- | ---: |
| Shell (Bash) | 2 |
| Umbraco MCP | 77 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 45 / 32 |
| Total tool calls | 79 |
| Tool calls per API request | 0.98 |
| Failed tool calls | 22 |
| Files written with heredocs | 0 |
| dotnet build (failed) | 0 (0) |

### Grade

| Category | Gemma 4 26B A4B |
| --- | ---: |
| It works (/35) | 5 |
| Content modeling (/25) | 13 |
| Code architecture & conventions (/25) | 1 |
| Content & presentation (/10) | 0 |
| Process & honesty (/5) | 1 |
| Total | 20/100 |
| Automated checks passed | 24/40 |
| Graded by | Opus 5.5 (high) |

#### Runs

- **Gemma 4 26B A4B** — `2026-10-10_1021_mcp-recipe_gemma-4-26b-a4b-high`, model `gemma-4-26b-a4b`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - The model left a partial schema built over MCP: three block element types, a Blog Block Grid data type, and blog front page and post types with sensible metadata properties. Allowed children and templates are not wired up, there is no real content (only three junk draft nodes), and there is no media, domain or Razor, so / returns 404. The session ended after 35 minutes without a report.
  - ⚠ Phase "Content: media, pages, publish": end marker not detected — phase collapsed to 0.
