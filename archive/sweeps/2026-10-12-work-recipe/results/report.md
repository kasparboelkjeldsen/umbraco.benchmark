# Umbraco benchmark — model comparison

Generated 12/10/2026, 12:30:20

## Test: MCP Recipe

### Time

| Phase | Devstral 2 | Mistral Small 2603 | Mimo V2.6 Flash | DeepSeek V4 Flash DSpark |
| --- | ---: | ---: | ---: | ---: |
| Prompt 1: verify MCP | 0:10 | 0:10 | 0:19 | 0:02 |
| Boot, read rules, plan → first type created | 1:55 | 0:47 | 0:53 | 1:12 |
| Content modeling | 0:44 | 0:32 | 1:28 | 0:18 |
| Content: media, pages, publish | 0:54 | 1:12 | 22:37 | 0:36 |
| Stop, build, Razor, restart | 3:19 | 1:07 | 6:08 | 4:08 |
| Checking the result and final report | 0:57 | 0:01 | 2:38 | 0:04 |
| Total from first prompt | 8:00 | 3:49 | 34:03 | 6:20 |
| Blog prompt only | 7:50 | 3:38 | 33:44 | 6:18 |

### Tokens

| Tokens | Devstral 2 | Mistral Small 2603 | Mimo V2.6 Flash | DeepSeek V4 Flash DSpark |
| --- | ---: | ---: | ---: | ---: |
| API requests | 75 | 51 | 80 | 70 |
| Fresh input | 103,583 | 254,264 | 121,232 | 69,457 |
| Cache creation | 0 | 0 | 0 | 0 |
| Cache read | 5,004,160 | 3,351,968 | 6,500,544 | 4,693,760 |
| Output | 18,765 | 18,667 | 38,405 | 27,258 |
| &nbsp;&nbsp;of which thinking | 0 | 3,653 | 19,539 | 0 |
| Total | 5,126,508 | 3,624,899 | 6,660,181 | 4,790,475 |
| Total excluding cache reads | 122,348 | 272,931 | 159,637 | 96,715 |
| Est. API-equivalent cost (USD) | $3.49 | $3.41 | — | $3.38 |

### Tokens by activity

| Activity | Devstral 2 | Mistral Small 2603 | Mimo V2.6 Flash | DeepSeek V4 Flash DSpark |
| --- | ---: | ---: | ---: | ---: |
| Umbraco MCP | 942,565 (18%) | 1,925,456 (53%) | 2,206,267 (33%) | 1,118,117 (23%) |
| Coding: site (views, components, models) | 806,580 (16%) | 146,038 (4%) | 1,079,367 (16%) | 801,998 (17%) |
| Build, run & verify | 377,379 (7%) | 240,852 (7%) | 189,017 (3%) | 205,267 (4%) |
| Base context & reasoning | 2,999,984 (59%) | 1,312,552 (36%) | 3,185,530 (48%) | 2,665,093 (56%) |

### Tokens by activity, excluding cache reads

| Activity | Devstral 2 | Mistral Small 2603 | Mimo V2.6 Flash | DeepSeek V4 Flash DSpark |
| --- | ---: | ---: | ---: | ---: |
| Umbraco MCP | 28,373 (23%) | 162,491 (60%) | 53,112 (33%) | 36,394 (38%) |
| Coding: site (views, components, models) | 26,891 (22%) | 28,904 (11%) | 45,508 (29%) | 35,786 (37%) |
| Build, run & verify | 21,885 (18%) | 21,456 (8%) | 16,445 (10%) | 16,688 (17%) |
| Base context & reasoning | 45,199 (37%) | 60,080 (22%) | 44,572 (28%) | 7,847 (8%) |

### Tool calls

| Tool | Devstral 2 | Mistral Small 2603 | Mimo V2.6 Flash | DeepSeek V4 Flash DSpark |
| --- | ---: | ---: | ---: | ---: |
| Shell (Bash) | 34 | 17 | 33 | 35 |
| Umbraco MCP | 42 | 49 | 59 | 46 |
| Read / Grep / Glob | 11 | 0 | 10 | 22 |
| Edit / Write | 17 | 14 | 15 | 14 |
| Background task control | 1 | 0 | 0 | 0 |
| &nbsp;&nbsp;Umbraco MCP reads / writes | 7 / 35 | 14 / 35 | 21 / 38 | 13 / 33 |
| Total tool calls | 105 | 80 | 117 | 117 |
| Tool calls per API request | 1.40 | 1.57 | 1.46 | 1.67 |
| Failed tool calls | 6 | 9 | 1 | 4 |
| Files written with heredocs | 0 | 0 | 0 | 0 |
| dotnet build (failed) | 5 (1) | 3 (2) | 3 (1) | 3 (0) |

### Grade

| Category | Devstral 2 | Mistral Small 2603 | Mimo V2.6 Flash | DeepSeek V4 Flash DSpark |
| --- | ---: | ---: | ---: | ---: |
| It works (/35) | 35 | 6 | 35 | 35 |
| Content modeling (/25) | 25 | 23 | 24 | 25 |
| Code architecture & conventions (/25) | 24 | 3 | 23.5 | 25 |
| Content & presentation (/10) | 5 | 1 | 8.5 | 7 |
| Process & honesty (/5) | 4.5 | 2 | 4.5 | 4.5 |
| Total | 93.5/100 | 35/100 | 95.5/100 | 96.5/100 |
| Automated checks passed | 42/43 | 14/18 | 42/43 | 43/43 |
| Graded by | Opus 5.5 (high) | Opus 5.5 (high) | Opus 5.5 (high) | Opus 5.5 (high) |

#### Runs

- **Devstral 2** — `2026-10-12_0904_mcp-recipe_devstral-2-high`, model `mistralai/devstral-2512`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - Devstral 2 followed the MCP recipe cleanly and built a fully working, correctly modeled block-grid blog: 3 blocks, the adapter → plain model → ViewComponent pipeline, a '/' domain and imported Unsplash media. 42/43 checks pass; the one FAIL is a false positive. The weak spots are very thin posts (~80 words each, invented quotes), a hacky untyped rich-text adapter, and rich text without paragraph spacing.
- **Mistral Small 2603** — `2026-10-12_1024_mcp-recipe_mistral-small-2603-high`, model `mistralai/mistral-small-2603`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - Mistral Small built a correct schema over MCP (three blocks, a /Custom block grid, blog front page and post types) and published two posts with a domain. Then it wrote its Razor into the solution root instead of the web project, and added ViewComponents with an invented base class. The build fails, the site never boots, and the posts describe MCP as an invented 'Model-Content-Property' pattern.
- **Mimo V2.6 Flash** — `2026-10-12_1046_mcp-recipe_mimo-v2.6-flash-high`, model `xiaomi/mimo-v2.6-flash`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A complete, working MCP-built blog: three-block grid (rich text, image, quote), a front page listing two image cards, and two on-topic posts of 5 blocks each, rendered through the exact adapter → ViewComponent pipeline with a clean Tailwind design. The only flaws are component views that inherit UmbracoViewPage, a blogFrontPage template assigned to siteRoot, and somewhat generic post copy.
- **DeepSeek V4 Flash DSpark** — `2026-10-12_1211_mcp-recipe_deepseek-v4-flash-dspark-high`, model `DeepSeek-V4-Flash-DSpark`, effort high, Claude Code 2.1.293, headless (npm run auto, bypassPermissions)
  - A clean, complete MCP-built blog: three blocks (rich text, image, quote) in a shared block grid, a card-listing front page on '/', two 4-block posts, and a textbook adapter → ViewComponent pipeline. Only the content is thin (4 short paragraphs per post, quotes attributed to real sources that never said them) and rich text paragraphs have no spacing.
