# Umbraco benchmark — model comparison

Generated 10/10/2026, 06:26:48

## All tests side by side (token split excludes cache reads)

|  | Haiku 4.5 · MCP Guided | Haiku 5.5 (high) · MCP Guided | Sonnet 5.5 (high) · MCP Guided | Opus 5.5 (high) · MCP Guided | Gemma 4 26B A4B (high) · MCP Guided+ |
| --- | ---: | ---: | ---: | ---: | ---: |
| Blog prompt time | 5:59 | 5:49 | 6:31 | 5:14 | 1:56:29 |
| API requests | 83 | 57 | 53 | 61 | 129 |
| Total tokens | 5,704,682 | 6,365,288 | 4,668,158 | 5,413,923 | 8,013,439 |
| Total excluding cache reads | 110,468 | 206,837 | 136,160 | 134,974 | 278,186 |
| &nbsp;&nbsp;Umbraco MCP | 57,345 (52%) | 109,843 (53%) | 80,235 (59%) | 81,817 (61%) | 198,709 (71%) |
| &nbsp;&nbsp;Coding: site (views, components, models) | 29,828 (27%) | 71,403 (35%) | 39,517 (29%) | 32,078 (24%) | 10,303 (4%) |
| &nbsp;&nbsp;Build, run & verify | 13,511 (12%) | 17,517 (8%) | 9,802 (7%) | 9,621 (7%) | 7,323 (3%) |
| &nbsp;&nbsp;Other tools | 0 (0%) | 1,365 (1%) | 557 (0%) | 3,129 (2%) | 0 (0%) |
| Tool calls | 125 | 121 | 107 | 92 | 128 |
| Grade | 66/100 | 96/100 | 99/100 | 99/100 | 17/100 |

## Test: MCP Guided

### Time

| Phase | Haiku 4.5 | Haiku 5.5 (high) | Sonnet 5.5 (high) | Opus 5.5 (high) |
| --- | ---: | ---: | ---: | ---: |
| Prompt 1: verify MCP | 0:08 | 0:05 | 0:10 | 0:07 |
| Boot, read rules, plan → first type created | 0:34 | 0:55 | 0:39 | 0:27 |
| Content modeling | 1:16 | 0:34 | 0:54 | 1:06 |
| Content: media, pages, publish | 1:38 | 1:15 | 2:00 | 1:33 |
| Stop, build, Razor, restart | 1:45 | 2:39 | 2:02 | 1:30 |
| Checking the result and final report | 0:46 | 0:26 | 0:55 | 0:39 |
| Total from first prompt | 6:07 | 5:54 | 6:41 | 5:21 |
| Blog prompt only | 5:59 | 5:49 | 6:31 | 5:14 |

### Tokens

| Tokens | Haiku 4.5 | Haiku 5.5 (high) | Sonnet 5.5 (high) | Opus 5.5 (high) |
| --- | ---: | ---: | ---: | ---: |
| API requests | 83 | 57 | 53 | 61 |
| Fresh input | 688 | 114 | 106 | 122 |
| Cache creation | 76,901 | 146,184 | 103,472 | 103,994 |
| Cache read | 5,594,214 | 6,158,451 | 4,531,998 | 5,278,949 |
| Output | 32,879 | 60,539 | 32,582 | 30,858 |
| &nbsp;&nbsp;of which thinking | 7,531 | 30,570 | 5,671 | 4,099 |
| Total | 5,704,682 | 6,365,288 | 4,668,158 | 5,413,923 |
| Total excluding cache reads | 110,468 | 206,837 | 136,160 | 134,974 |
| Est. API-equivalent cost (USD) | $0.88 | — | — | — |

### Tokens by activity

| Activity | Haiku 4.5 | Haiku 5.5 (high) | Sonnet 5.5 (high) | Opus 5.5 (high) |
| --- | ---: | ---: | ---: | ---: |
| Umbraco MCP | 2,247,254 (39%) | 3,399,192 (53%) | 2,260,345 (48%) | 2,761,502 (51%) |
| Coding: site (views, components, models) | 872,032 (15%) | 1,085,496 (17%) | 822,110 (18%) | 867,920 (16%) |
| Build, run & verify | 186,378 (3%) | 349,150 (5%) | 169,325 (4%) | 87,470 (2%) |
| Other tools | 0 (0%) | 21,429 (0%) | 8,091 (0%) | 29,169 (1%) |
| Base context & reasoning | 2,399,019 (42%) | 1,510,022 (24%) | 1,408,287 (30%) | 1,667,860 (31%) |

### Tokens by activity, excluding cache reads

| Activity | Haiku 4.5 | Haiku 5.5 (high) | Sonnet 5.5 (high) | Opus 5.5 (high) |
| --- | ---: | ---: | ---: | ---: |
| Umbraco MCP | 57,345 (52%) | 109,843 (53%) | 80,235 (59%) | 81,817 (61%) |
| Coding: site (views, components, models) | 29,828 (27%) | 71,403 (35%) | 39,517 (29%) | 32,078 (24%) |
| Build, run & verify | 13,511 (12%) | 17,517 (8%) | 9,802 (7%) | 9,621 (7%) |
| Other tools | 0 (0%) | 1,365 (1%) | 557 (0%) | 3,129 (2%) |
| Base context & reasoning | 9,784 (9%) | 6,709 (3%) | 6,049 (4%) | 8,327 (6%) |

### Tool calls

| Tool | Haiku 4.5 | Haiku 5.5 (high) | Sonnet 5.5 (high) | Opus 5.5 (high) |
| --- | ---: | ---: | ---: | ---: |
| Shell (Bash) | 22 | 24 | 18 | 21 |
| Shell (PowerShell) | 5 | 0 | 0 | 2 |
| Umbraco MCP | 56 | 61 | 62 | 59 |
| Read / Grep / Glob | 10 | 13 | 3 | 2 |
| Edit / Write | 22 | 17 | 18 | 0 |
| ToolSearch | 10 | 4 | 5 | 7 |
| Background task control | 0 | 2 | 1 | 1 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 15 / 41 | 24 / 37 | 25 / 37 | 25 / 34 |
| Total tool calls | 125 | 121 | 107 | 92 |
| Tool calls per API request | 1.51 | 2.12 | 2.02 | 1.51 |
| Failed tool calls | 9 | 0 | 0 | 2 |
| Files written with heredocs | 0 | 0 | 0 | 14 files in 2 calls |
| dotnet build (failed) | 5 (2) | 2 (0) | 4 (2) | 3 (0) |

### Grade

| Category | Haiku 4.5 | Haiku 5.5 (high) | Sonnet 5.5 (high) | Opus 5.5 (high) |
| --- | ---: | ---: | ---: | ---: |
| It works (/35) | 21 | 35 | 35 | 35 |
| Content modeling (/25) | 21 | 25 | 25 | 25 |
| Code architecture & conventions (/25) | 20 | 25 | 25 | 24 |
| Content & presentation (/10) | 2 | 8 | 10 | 10 |
| Process & honesty (/5) | 2 | 3 | 4 | 5 |
| Total | 66/100 | 96/100 | 99/100 | 99/100 |
| Automated checks passed | 41/43 | 43/43 | 43/43 | 43/43 |
| Graded by | Opus 5.5 (high) | Opus 5.5 (high) | Opus 5.5 (high) | Opus 5.5 (high) |

#### Runs

- **Haiku 4.5** — `2026-10-07_2206_mcp-guided_haiku-4.5`, model `claude-haiku-4-5-20251001`, effort ?, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - Haiku 4.5 built a clean, convention-following schema (3 blocks, front page and post types, a domain, imported Unsplash media) through MCP, and adapter→ViewComponent plumbing that matches AGENTS.md. But the site doesn't work as a blog: the front page lists no posts, rich text renders as escaped HTML, there is no layout or stylesheet, and the posts are thin. The final report claims everything works.
- **Haiku 5.5 (high)** — `2026-10-07_2226_mcp-guided_haiku-5.5-high`, model `claude-haiku-5-5`, effort high, Claude Code 2.1.293, headless (npm run auto, auto)
  - A clean, fully working MCP-built blog: three well-modeled blocks (text, image, quote), correctly filed types, a domain on the front page, the exact adapter → ViewComponent pipeline, and a polished Tailwind layout. Points lost only for short posts, /tmp scratch files, and a final report that blames AGENTS.md for an error the model caused itself.
- **Sonnet 5.5 (high)** — `2026-10-08_0909_mcp-guided_sonnet-5.5-high`, model `claude-sonnet-5-5`, effort high, Claude Code 2.1.293, headless (npm run auto, auto)
  - A complete MCP-built blog: three blocks (rich text, image, quote) in one block grid, a front page with a polished card listing and two published, well-written posts about MCP, rendered through clean adapter -> ViewComponent code with Tailwind styling. Everything works and follows the conventions; the only blemish is scratch files written to /tmp.
- **Opus 5.5 (high)** — `2026-10-08_0920_mcp-guided_opus-5.5-high`, model `claude-opus-5-5`, effort high, Claude Code 2.1.293, headless (npm run auto, auto)
  - A complete, convention-perfect MCP-built blog: three-block block grid on both page types, two substantive MCP posts with provided Unsplash photos, and a clean Tailwind design; all 43 automated checks pass. Only nit is two templates duplicating the page shell instead of sharing a layout.

## Test: MCP Guided+

### Time

| Phase | Gemma 4 26B A4B |
| --- | ---: |
| Prompt 1: verify MCP | 2:28 |
| Boot, read rules, plan → first type created | 7:10 |
| Content modeling | 5:26 |
| Content: media, pages, publish | 0:00 |
| Stop, build, Razor, restart | 1:41:11 |
| Checking the result and final report | 2:41 |
| Total from first prompt | 1:58:57 |
| Blog prompt only | 1:56:29 |

### Tokens

| Tokens | Gemma 4 26B A4B |
| --- | ---: |
| API requests | 129 |
| Fresh input | 191,409 |
| Cache creation | 0 |
| Cache read | 7,735,253 |
| Output | 86,777 |
| &nbsp;&nbsp;of which thinking | 0 |
| Total | 8,013,439 |
| Total excluding cache reads | 278,186 |

### Tokens by activity

| Activity | Gemma 4 26B A4B |
| --- | ---: |
| Umbraco MCP | 3,258,354 (41%) |
| Coding: site (views, components, models) | 640,003 (8%) |
| Build, run & verify | 337,551 (4%) |
| Base context & reasoning | 3,777,532 (47%) |

### Tokens by activity, excluding cache reads

| Activity | Gemma 4 26B A4B |
| --- | ---: |
| Umbraco MCP | 198,709 (71%) |
| Coding: site (views, components, models) | 10,303 (4%) |
| Build, run & verify | 7,323 (3%) |
| Base context & reasoning | 61,852 (22%) |

### Tool calls

| Tool | Gemma 4 26B A4B |
| --- | ---: |
| Shell (Bash) | 27 |
| Umbraco MCP | 101 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 63 / 38 |
| Total tool calls | 128 |
| Tool calls per API request | 0.99 |
| Failed tool calls | 30 |
| Files written with heredocs | 0 |
| dotnet build (failed) | 0 (0) |
| Context compactions | 2 |

### Grade

| Category | Gemma 4 26B A4B |
| --- | ---: |
| It works (/35) | 0 |
| Content modeling (/25) | 14 |
| Code architecture & conventions (/25) | 2 |
| Content & presentation (/10) | 0 |
| Process & honesty (/5) | 1 |
| Total | 17/100 |
| Automated checks passed | 14/18 |
| Graded by | Opus 5.5 (high) |

#### Runs

- **Gemma 4 26B A4B** — `2026-10-08_0629_mcp-guided-plus_gemma-4-26b-a4b-high`, model `gemma-4-26b-a4b`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - Got only partway through step 3: three blocks, a Blog Block Grid data type, and front page and post types filed in the right folders. It never assigned templates or allowed children, created no media, pages or domain, wrote two templates that break the build, and timed out after 2 hours with no report.
  - ⚠ Phase "Content: media, pages, publish": end marker not detected — phase collapsed to 0.
