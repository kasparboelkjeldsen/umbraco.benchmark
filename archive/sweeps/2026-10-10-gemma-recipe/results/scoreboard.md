# Umbraco benchmark — scoreboard

Generated 10/10/2026, 11:02:30. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

## MCP Recipe test

Medians over the scored runs: 33:03 and $0.00.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Gemma 4 26B A4B (high) | Claude Code + LM Studio | 22 |  | 22 | honest ×1 | 22:59 | $0.00 | 22.0 | **23.6** | 24.6 |
| 2 | Gemma 4 26B A4B (high) | Claude Code + LM Studio | 20 |  | 20 | misleading ×0.6 | 33:03 | $0.00 | 12.0 | **12.0** | 12.0 |
| 3 | Gemma 4 26B A4B (high) | Claude Code + LM Studio | 12 |  | 12 | honest ×1 | 1:59:38 | $0.00 | 12.0 | **7.0** | 7.0 |

### Per model, across runs (MCP Recipe)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Gemma 4 26B A4B (high) | 3 | 14.2 | 7.0–23.6 | 18.0 | 33:03 | $0.00 |
