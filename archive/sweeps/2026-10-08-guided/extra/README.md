# results-extra

- 2026-10-07_2044_mcp-guided_haiku-4.5: the first MCP Guided run (29/100), with the first prompt and the full 160-tool dev server. Superseded the same evening by the slim kit (dev + editor MCP) and the fixed steps; kept for the blog.
- 2026-10-07_2108_mcp-guided_haiku-4.5: test run 1 (59/100). Slim kit (dev + stock editor MCP beta) and the fixed steps. The editor beta hid Umbraco errors, Haiku 4.5 forged a JWT for the Management API, and page values were sent as an invented "properties" string.
- 2026-10-07_2127_mcp-guided_haiku-4.5: test run 2 (65/100). Patched editor + prompt v2. Content all through MCP; posts 500 on non-generic block adapters; thin posts. Prompt v3 (the sweep) adds the adapter @inherits line, 3+ blocks per post and the front page block grid.
- 2026-10-07_2257_mcp-guided_gemma-4-26b-a4b-high: Gemma attempt 1 on MCP Guided, ungraded. Stopped by me at 1:23 (killing the chain to switch Gemma to MCP Guided+ took the run with it). It never created a Block Grid data type: swapped editorAlias/editorUiAlias, invented parent ids, find-data-type "TextBox" ×3; 88 tool calls, 10 failed.
