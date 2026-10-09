# Umbraco benchmark — scoreboard

Generated 09/10/2026, 15:24:10. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

## MCP test

Medians over the scored runs: 0:00 and —.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
|  | DeepSeek V4 Flash DSpark (high) | Claude Code + API endpoint | 53 |  | 53 | pending | 5:31 | $0.00 | — | **—** | — |
|  | DeepSeek V4 Flash DSpark (high) | Claude Code + API endpoint | 65 |  | 65 | pending | 28:32 | $0.00 | — | **—** | — |

## MCP guided (Editor) test

Medians over the scored runs: 0:00 and —.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
|  | DeepSeek V4 Flash DSpark (high) | Claude Code + API endpoint | 12 |  | 12 | pending | 1:10 | $0.00 | — | **—** | — |
|  | DeepSeek V4 Flash DSpark (high) | Claude Code + API endpoint | 75 |  | 75 | pending | 3:40 | $0.00 | — | **—** | — |
