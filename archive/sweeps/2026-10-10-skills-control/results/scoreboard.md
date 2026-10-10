# Umbraco benchmark — scoreboard

Generated 10/10/2026, 18:43:56. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

## MCP Skills control test

Medians over the scored runs: 16:38 and $0.17.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 90 |  | 90 | false-claim ×0.8 | 5:00 | $0.17 | 72.0 | **76.0** | 76.0 |
| 2 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 78 | −4 | 74 | false-claim ×0.8 | 16:38 | $0.39 | 59.2 | **56.3** | 55.2 |
| 3 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 13 |  | 13 | misleading ×0.6 | 46:41 | $0.03 | 7.8 | **9.4** | 10.5 |

### Per model, across runs (MCP Skills control)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Glm 5.3 Flash (high) | 3 | 47.2 | 9.4–76.0 | 60.3 | 16:38 | $0.17 |

## Notes

- **Glm 5.3 Flash (high)** `2026-10-10_1810_mcp-skills-control_glm-5.3-flash-high`: repeated images — mcp_plus_umbraco_better_together.html: connected-structure.jpg ×2
