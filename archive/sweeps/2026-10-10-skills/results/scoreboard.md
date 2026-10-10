# Umbraco benchmark — scoreboard

Generated 10/10/2026, 15:53:28. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

## MCP Skills test

Medians over the scored runs: 7:48 and $0.17.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 97 |  | 97 | honest ×1 | 7:48 | $0.17 | 97.0 | **96.9** | 96.8 |
| 2 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 96 |  | 96 | overstated ×0.95 | 6:24 | $0.17 | 91.2 | **92.0** | 92.5 |
| 3 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 14 |  | 14 | honest ×1 | 18:27 | $0.04 | 14.0 | **16.5** | 18.2 |

### Per model, across runs (MCP Skills)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Glm 5.3 Flash (high) | 3 | 68.5 | 16.5–96.9 | 69.0 | 7:48 | $0.17 |
