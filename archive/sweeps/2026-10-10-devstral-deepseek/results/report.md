# Umbraco benchmark — model comparison

Generated 10/10/2026, 21:08:54

## All tests side by side (token split excludes cache reads)

|  | Devstral 2 · MCP | DeepSeek V4 Flash 0731 · MCP | Devstral 2 · MCP Recipe |
| --- | ---: | ---: | ---: |
| Blog prompt time | 8:44 | 9:27 | 6:41 |
| API requests | 177 | 89 | 84 |
| Total tokens | 20,138,318 | 10,877,896 | 5,909,606 |
| Total excluding cache reads | 186,958 | 207,816 | 297,830 |
| &nbsp;&nbsp;Umbraco MCP | 53,605 (29%) | 61,861 (30%) | 34,858 (12%) |
| &nbsp;&nbsp;Coding: migrations | 239 (0%) | 3,177 (2%) | 0 (0%) |
| &nbsp;&nbsp;Coding: site (views, components, models) | 45,967 (25%) | 53,435 (26%) | 24,493 (8%) |
| &nbsp;&nbsp;Build, run & verify | 15,598 (8%) | 24,015 (12%) | 157,414 (53%) |
| Tool calls | 189 | 150 | 110 |
| Grade | 44/100 | 94/100 | 96/100 |

## Test: MCP

### Time

| Phase | Devstral 2 | DeepSeek V4 Flash 0731 | Difference |
| --- | ---: | ---: | ---: |
| Prompt 1: verify MCP | 0:24 | 0:09 | −0:14 |
| Boot, read rules, plan → first type created | 1:00 | 2:13 | +1:13 |
| Content modeling | 0:56 | 0:54 | −0:02 |
| Content: media, pages, publish | 1:13 | 1:25 | +0:12 |
| Stop, build, Razor, restart | 5:35 | 3:56 | −1:38 |
| Checking the result and final report | 0:00 | 0:58 | +0:58 |
| Total from first prompt | 9:08 | 9:36 | +0:28 (+5.1%) |
| Blog prompt only | 8:44 | 9:27 | +0:42 (+8.1%) |

### Tokens

| Tokens | Devstral 2 | DeepSeek V4 Flash 0731 | Difference | Change |
| --- | ---: | ---: | ---: | ---: |
| API requests | 177 | 89 | −88 | −49.7% |
| Fresh input | 162,292 | 142,418 | −19,874 | −12.2% |
| Cache creation | 0 | 0 | 0 | — |
| Cache read | 19,951,360 | 10,670,080 | −9,281,280 | −46.5% |
| Output | 24,666 | 65,398 | +40,732 | +165.1% |
| &nbsp;&nbsp;of which thinking | 0 | 37,949 | +37,949 | — |
| Total | 20,138,318 | 10,877,896 | −9,260,422 | −46.0% |
| Total excluding cache reads | 186,958 | 207,816 | +20,858 | +11.2% |
| Est. API-equivalent cost (USD) | — | $7.68 |  |  |

### Tokens by activity

| Activity | Devstral 2 | DeepSeek V4 Flash 0731 | Difference |
| --- | ---: | ---: | ---: |
| Umbraco MCP | 4,460,354 (22%) | 2,226,738 (20%) | −2,233,616 |
| Coding: migrations | 26,519 (0%) | 224,825 (2%) | +198,306 |
| Coding: site (views, components, models) | 3,364,619 (17%) | 1,740,705 (16%) | −1,623,914 |
| Build, run & verify | 778,086 (4%) | 396,942 (4%) | −381,144 |
| Base context & reasoning | 11,508,741 (57%) | 6,288,686 (58%) | −5,220,055 |

### Tokens by activity, excluding cache reads

| Activity | Devstral 2 | DeepSeek V4 Flash 0731 | Difference |
| --- | ---: | ---: | ---: |
| Umbraco MCP | 53,605 (29%) | 61,861 (30%) | +8,256 |
| Coding: migrations | 239 (0%) | 3,177 (2%) | +2,938 |
| Coding: site (views, components, models) | 45,967 (25%) | 53,435 (26%) | +7,468 |
| Build, run & verify | 15,598 (8%) | 24,015 (12%) | +8,417 |
| Base context & reasoning | 71,549 (38%) | 65,329 (31%) | −6,220 |

### Tool calls

| Tool | Devstral 2 | DeepSeek V4 Flash 0731 | Difference |
| --- | ---: | ---: | ---: |
| Shell (Bash) | 39 | 52 | +13 |
| Umbraco MCP | 91 | 67 | −24 |
| Read / Grep / Glob | 15 | 12 | −3 |
| Edit / Write | 41 | 19 | −22 |
| Background task control | 3 | 0 | −3 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 49 / 42 | 29 / 38 |  |
| Total tool calls | 189 | 150 | −39 |
| Tool calls per API request | 1.07 | 1.69 |  |
| Failed tool calls | 9 | 6 | −3 |
| Files written with heredocs | 0 | 0 |  |
| dotnet build (failed) | 7 (3) | 2 (0) |  |

### Grade

| Category | Devstral 2 | DeepSeek V4 Flash 0731 | Difference |
| --- | ---: | ---: | ---: |
| It works (/35) | 7 | 35 | +28 |
| Content modeling (/25) | 15 | 23 | +8 |
| Code architecture & conventions (/25) | 20 | 25 | +5 |
| Content & presentation (/10) | 0 | 6 | +6 |
| Process & honesty (/5) | 2 | 5 | +3 |
| Total | 44/100 | 94/100 | +50 |
| Automated checks passed | 34/42 | 43/43 |  |
| Graded by | Opus 5.5 (high) | Opus 5.5 (high) |  |

#### Runs

- **Devstral 2** — `2026-10-10_2007_mcp_devstral-2-high`, model `mistralai/devstral-2512`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - Devstral 2 set up a correctly-foldered schema (4 block elements, front page and post page types) and a convention-following adapter → ViewComponent pipeline. But the Block Grid had no configured blocks, all document content ended up empty, and every URL including / returns 404 'No template exists'. The run hit the token budget before it could fix this or report.
- **DeepSeek V4 Flash 0731** — `2026-10-10_2055_mcp_deepseek-v4-flash-0731-high`, model `deepseek/deepseek-v4-flash-0731`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A clean MCP-built blog: blogHome and blogPost with a 4-block grid (hero, rich text, image, quote), rendered by the book (exact-alias adapters -> ViewComponents -> plain models), with a correct domain, media and publishing, and everything works. Points are lost on thin posts with invented quote attributions, an unused coverImage, and no real publish-date property.

## Test: MCP Recipe

### Time

| Phase | Devstral 2 |
| --- | ---: |
| Prompt 1: verify MCP | 0:09 |
| Boot, read rules, plan → first type created | 1:51 |
| Content modeling | 0:52 |
| Content: media, pages, publish | 0:45 |
| Stop, build, Razor, restart | 1:14 |
| Checking the result and final report | 1:59 |
| Total from first prompt | 6:50 |
| Blog prompt only | 6:41 |

### Tokens

| Tokens | Devstral 2 |
| --- | ---: |
| API requests | 84 |
| Fresh input | 279,578 |
| Cache creation | 0 |
| Cache read | 5,611,776 |
| Output | 18,252 |
| &nbsp;&nbsp;of which thinking | 0 |
| Total | 5,909,606 |
| Total excluding cache reads | 297,830 |
| Est. API-equivalent cost (USD) | $4.66 |

### Tokens by activity

| Activity | Devstral 2 |
| --- | ---: |
| Umbraco MCP | 1,101,789 (19%) |
| Coding: site (views, components, models) | 842,364 (14%) |
| Build, run & verify | 812,982 (14%) |
| Base context & reasoning | 3,152,470 (53%) |

### Tokens by activity, excluding cache reads

| Activity | Devstral 2 |
| --- | ---: |
| Umbraco MCP | 34,858 (12%) |
| Coding: site (views, components, models) | 24,493 (8%) |
| Build, run & verify | 157,414 (53%) |
| Base context & reasoning | 81,064 (27%) |

### Tool calls

| Tool | Devstral 2 |
| --- | ---: |
| Shell (Bash) | 32 |
| Umbraco MCP | 51 |
| Read / Grep / Glob | 11 |
| Edit / Write | 16 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 15 / 36 |
| Total tool calls | 110 |
| Tool calls per API request | 1.31 |
| Failed tool calls | 6 |
| Files written with heredocs | 0 |
| dotnet build (failed) | 3 (1) |

### Grade

| Category | Devstral 2 |
| --- | ---: |
| It works (/35) | 35 |
| Content modeling (/25) | 25 |
| Code architecture & conventions (/25) | 25 |
| Content & presentation (/10) | 6 |
| Process & honesty (/5) | 5 |
| Total | 96/100 |
| Automated checks passed | 43/43 |
| Graded by | Opus 5.5 (high) |

#### Runs

- **Devstral 2** — `2026-10-10_2021_mcp-recipe_devstral-2-high`, model `mistralai/devstral-2512`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A complete, correctly modelled MCP-built blog: three blocks in a Custom Block Grid, the two page types, published content with a domain on the front page, and textbook adapter -> ViewComponent rendering. Everything works and every convention is met; the only weak spot is the content: short posts (one of them meta), made-up quotes, and unstyled rich-text lists.
