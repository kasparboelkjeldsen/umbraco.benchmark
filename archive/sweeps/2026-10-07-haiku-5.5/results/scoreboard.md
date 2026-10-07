# Umbraco benchmark — scoreboard

Generated 07/10/2026, 20:42:29. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

Medians over the scored runs: 5:22 and $0.32.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Haiku 5.5 (high) | Claude Code | 96 |  | 96 | honest ×1 | 5:48 | $0.32 | 96.0 | **95.7** | 95.5 |
| 2 | Haiku 5.5 (high) | Claude Code | 90 |  | 90 | honest ×1 | 4:55 | $0.32 | 90.0 | **90.4** | 90.6 |

## Per model, across runs

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Haiku 5.5 (high) | 2 | 93.0 | 90.4–95.7 | 93.0 | 5:22 | $0.32 |
