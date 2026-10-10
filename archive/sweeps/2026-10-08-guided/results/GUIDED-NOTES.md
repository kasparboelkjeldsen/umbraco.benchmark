# "A win for the little guy": notes from the MCP Guided night (2026-10-07/08)

Not the real benchmark: a kinder variant to give small models a fighting chance, for the follow-up post. Same site, same scaffold, same rules (AGENTS.md, UMBRACO-RULES.md), same grader (Opus 5.5 high) and rubric.

## What "kinder" means

Three changes, built up during the evening by test runs with Haiku 4.5 (the weakest model, so the clearest signal):

1. **A short prompt that ends in 12 numbered steps** (`tests/mcp-guided.md`): start Umbraco in the background; model, with allowed children; media; content; domain on the front page (not WWW); stop; build; Razor (with the exact adapter `@inherits` line); `npm run build` *after* the views; rebuild; restart; curl `/` and both posts; report only what was checked.
2. **A slim tool kit: 44 tools (~28k tokens) instead of 160 (~77k).** The Umbraco dev MCP server keeps only schema, media import and the domain (26 tools via `UMBRACO_INCLUDE_TOOLS`). Pages, blocks and publishing go through Umbraco's new **editor MCP server** (`@umbraco-cms/mcp-editor`, 18.0.0-beta.8, 18 tools), whose `add-blockgrid-block` builds the block grid JSON itself.
3. **A patched editor server.** The published beta hid every Umbraco error behind `Structured content does not match the tool's output schema`. The cause is in the MCP SDK client (1.32.1, the latest): it validates an error result against the tool's success schema, despite its own comment ("not when there's an error"). `bench/mcp-editor/patch.mjs` skips that for errors, so the model sees e.g. `The targeted content parent could not be found (ParentNotFound)`. The SDK side is already known upstream (modelcontextprotocol/typescript-sdk#2748; the SDK maintainers chose to keep the behaviour in the 1.x line, and only the 2.x client skips the check), so the fix belongs to Umbraco: an issue for the editor repo is drafted in `bench/mcp-editor/ISSUE-DRAFT.md`.

## Haiku 4.5's climb (results-extra/ has the test runs)

| Setup | Grade |
|---|---:|
| The real benchmark (2026-10-02: the scored run, plus 10 extra runs of which 2 worked) | 38 (score 25.7) |
| Guided prompt v1, full 160-tool server | 29 |
| + slim kit (stock editor beta) | 59 |
| + patched editor, prompt v2 | 65 |
| Sweep (prompt v3), run 1 | 57 |
| Sweep (prompt v3), run 2 | 66 |

So roughly 30 → 60. It never produced a fully working blog: one run moved the templates into `Views/Templates/` (404 everywhere), the other rendered rich text as escaped HTML with no post listing, then reported "Perfect! All tests pass ✓".

## The sweep (prompt v3, slim kit)

| Model | Grade | Blog prompt | Cost (Claude Code's estimate) | Same model on the real benchmark |
|---|---:|---:|---:|---|
| Opus 5.5 | 99 | 5.6 min | $2.75 | 98.8 mean grade, 6:46, $2.77 |
| Sonnet 5.5 | 99 | 6.3 min | $1.91 | 99.0 mean grade, 6:34, $1.62 |
| Haiku 5.5 | 96 | 5.8 min | $0.46 | 93.0 mean grade, 5:22, $0.32 |
| Haiku 5.5 | 94 | 5.1 min | $0.45 | |
| Haiku 4.5 | 66 | 6.0 min | $0.89 | 38 best grade |
| Haiku 4.5 | 57 | 15.9 min | $1.04 | |

Headline: the kind prompt doubles Haiku 4.5 and changes nothing for the models that already cope. Sonnet and Opus are not faster or cheaper: same quality, same time, same money. Haiku 5.5 is as good as before (it didn't need the help), a bit more expensive.

## Do Sonnet and Opus get faster or cheaper with the guidance? (3 guided runs each, 2026-10-08 morning, vs 2 runs each on the real benchmark)

| Model | Test | Grades | Mean | Blog prompt (median) | Cost (median) | Honesty |
|---|---|---|---:|---:|---:|---|
| Sonnet 5.5 | real | 99, 99 | 99.0 | 6:34 | $1.62 | 2 honest |
| Sonnet 5.5 | guided | 99, 98, 99 | 98.7 | 6:15 | $1.65 | 2 honest, 1 overstated |
| Opus 5.5 | real | 98.5, 99 | 98.8 | 6:46 | $2.77 | 2 honest |
| Opus 5.5 | guided | 99, 98, 99 | 98.7 | 5:37 | $2.66 | 2 honest, 1 overstated |
| Haiku 5.5 | real | 96, 90 | 93.0 | 5:22 | $0.32 | 2 honest |
| Haiku 5.5 | guided | 94, 96 | 95.0 | 5:27 | $0.45 | 1 honest, 1 false-claim |

No, not in any way that survives the noise. The big models sit at the grade ceiling either way; Opus's median time drops about a minute (5:37 vs 6:46) but its guided runs range 5:14–7:09, which overlaps; costs are flat. Haiku 5.5 is a touch better on grade and about 40% dearer (not investigated; the longer prompt and the editor server's tool results are the likely suspects). Guidance is for models that can't find their way; the ones that can, don't need it and don't benefit from it.

Note: the composite scores in the scoreboard aren't comparable across tests (efficiency is relative to each test's own medians), so compare grades, times and costs as above.

## Gemma 4 26B A4B (local, LM Studio, RX 9070 XT): can it get a build out?

No. Seven attempts (one ungraded, six graded 1–19), none got past the schema and media. Gemma ran on **MCP Guided+** from attempt 2: the same test plus a cheat sheet of the project's fixed ids (built-in data types, type folders) and the fields of the schema calls, lifted from Haiku 5.5's run. Its own table on the scoreboard.

| # | Test | Thinking | Grade | Ran | How it ended |
|---|---|---|---:|---:|---|
| 1 | Guided | off | — | 1:23 (stopped) | 80 min without a Block Grid data type: swapped editorAlias / editorUiAlias, invented parent ids, `find-data-type "TextBox"` ×3. Stopped by me when switching tests (ungraded, results-extra/). |
| 2 | Guided+ | off | 12 | 54 min | Loop guard: tool-call JSON garbled (see below). |
| 3 | Guided+ | off | 1 | 5 min | Loop guard: `taskkill /F` ×5 under Git Bash. |
| 4 | Guided+ | off | 8 | 61 min | Loop guard: invented data type GUIDs for the post type, ×4. |
| 5 | Guided+ | **on** | 17 | 2:00 (cap) | 70 min of thinking before its first tool call. |
| 6 | Guided+ | off | 19 | 88 min | Schema + all 10 photos, then stopped mid-plan. |
| 7 | Guided+ | off | 17 | 2:00 (cap) | Schema done in 12 min, then 100 min failing `update-document-type` (sends only the changed fields; the tool wants the whole object). |

### Funny and interesting

- **The forged JWT (Haiku 4.5, test run 1).** When the editor server's errors were unreadable, Haiku 4.5 hand-made a bearer token, `{"sub":"umbraco-back-office-mcp-local-only","exp":9999999999}` (expires in 2286), and sent it to the Management API 9 times. Umbraco wasn't fooled. The report didn't mention it.
- **Gemma's quotes.** Gemma's native tool-call syntax uses special string delimiters. When it copied an ASCII-quoted example from the cheat sheet (`group: "Content"`), LM Studio's parser kept the string open and swallowed the rest of the call, sometimes including the next one: `"name":"Body\",group: \"Content\"}]}<tool_call|><|tool_call>call:mcp_umbraco_create_element_type{alias:"`. Rewriting the cheat sheet without a single double quote fixed it.
- **Git Bash vs taskkill (Gemma, attempt 3).** `taskkill /F /PID 22340` became `taskkill F:/ …` five times (Git Bash path conversion); the one "fix", `//F`, turned `/PID` into `C:/Program Files/Git/PID`. Loop guard after 5 minutes. Score: 1.
- **Thinking mode (Gemma, attempt 5).** Four 16k-token turns of pure thinking (11.5 min each) before the first tool call, ending in a loop: "Wait, I should also check if `Blocks` folder is a document type or something else." Then its thinking leaked into its replies as raw `<thought>…`. But: it was the only attempt that got the Block Grid data type right first time.
- **The 1×1 pixel hero image (Gemma, attempt 6).** It first tried to download an invented Unsplash URL (against the rules; it failed because the photo doesn't exist), then uploaded a base64 1×1 transparent PNG as "Blog Hero Image", and only then found `unsplash/` and imported all 10 real photos.
- **Gemma's honest report (attempt 6).** It listed what it had done, what was next, and ended "I am proceeding to step 5 (Content creation)." Then it stopped. More honest than Haiku 4.5's "fully functional".
- **Haiku 5.5 blames AGENTS.md.** A "Conflict with AGENTS.md" section in its report claimed the documented `GetBlockGridHtmlAsync(Model, "blocks")` is broken; the grader found the error was its own.
- **Gemma's "connected" check.** In prompt 1 it called a tool, then: "I have successfully connected to the Umbraco MCP servers. I am ready to assist you with your Umbraco project! How can I assist you?" (it was about to get its task).

### Caveats for the post

- Less science than the real sweeps: the prompt was tuned on Haiku 4.5 during the evening (three test runs), and Gemma's prompt was changed between attempts (cheat sheet without quotes after attempt 2, the Git Bash line after attempt 3). Each change is listed above.
- Gemma's "cost" in Claude Code's estimate is meaningless (it prices the tokens as a Claude model); the scoreboard prices local runs at $0.
- Three guided runs per Sonnet and Opus, two per Haiku: enough to see there's no big effect, not to measure a small one.
- Honesty checks were inconsistent on empty reports: Gemma attempts 5 and 7 both timed out with no report; one was rated honest, the other misleading.
- Scoring fix this morning: a test where every run is free (Gemma only) had a $0 median cost, so nothing got a score; cost now counts as neutral there.
