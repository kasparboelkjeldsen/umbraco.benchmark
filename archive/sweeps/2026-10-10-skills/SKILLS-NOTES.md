# MCP Skills, 2026-10-10: GLM 5.3 Flash ×3

The test uses the MCP test's own prompt, almost word for word, plus MCP Guided's slim kit: the dev MCP server and the patched editor MCP server. The recipe's knowledge ships in the project instead of the prompt:

- four Claude Code skills in `.claude/skills/`: umbraco-dev-loop, umbraco-schema, umbraco-content and umbraco-blockgrid-views (from C:\code\umbraco-mcp-skills)
- the guardrails in `.claude/CLAUDE.md`, which is always loaded and ends with "Use the umbraco-* skills"

The prompt never mentions skills.

| Run | Skills loaded | Grade | Honesty | Blog prompt | Cost | What happened |
|---|---|---:|---|---:|---:|---|
| 15:06 | schema at 1:07, content at 2:10, blockgrid-views at 6:22 | 97 | honest | 7:48 | $0.17 | Fetched each skill right before that phase; 4 failed calls |
| 15:18 | none | 14 | honest (no report) | 18:27 | $0.04 | Block Grid data type sent with empty values; a stray `<|assistant|>` token; then forensics (SQLite, NuGet cache, logs, Management API); then 47 identical `sleep 300` calls in one turn until the loop guard stopped it |
| 15:40 | none | 96 | overstated | 6:24 | $0.17 | Built it from the tool descriptions and the CLAUDE.md guardrails alone; 2 failed calls |

For comparison, GLM 5.3 Flash on other tests:

| Test | Grades |
|---|---|
| Plain MCP test (full dev server, no editor server, no guardrails) | 57 and 86 |
| MCP Recipe (the knowledge in the prompt) | 97.5 and 98.5 |

## Reading

- **The model loaded the skills in only 1 run of 3.** When it did, it used them well: it fetched each skill right before the phase it covers, and the run was clean.
- **Run 3 didn't need them.** Two things are in every MCP Skills run and were never in the plain MCP test: the slim kit with the editor server, and the always-loaded guardrails. Those alone got GLM a 96 once. Three runs can't separate what the skills add from what the kit and guardrails add. That needs a control: the same test with an empty `.claude/skills/`.
- **The guardrails are no guarantee.** Run 2 went digging despite CLAUDE.md forbidding exactly that. It started after a garbled turn (the stray token), and the run never recovered. Skills couldn't have saved it: that's model reliability, and over three tests it happened in 1 of 9 GLM runs.
- **The knowledge in the prompt (Recipe) was the most reliable route: 2 of 2 runs.** Skills plus guardrails gave 2 of 3. Too few runs to call it a difference.

## What to try next

- **Make loading the skills less optional:** a line in CLAUDE.md such as "Before any schema call, load umbraco-schema", or a skill-loading step in the prompt.
- **Move the sharpest facts into the MCP tools themselves:** `Umbraco.BlockGrid` as the editor alias, the shape of `values` on the Block Grid data type, and the publish order. Then they arrive with every call, whether or not a skill was loaded.
- **Run the control** (the kit and guardrails, no skills) to see what the skills add on their own.
