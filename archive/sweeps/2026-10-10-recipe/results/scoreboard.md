# Umbraco benchmark — scoreboard

Generated 10/10/2026, 07:44:11. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

## MCP Recipe test

Medians over the scored runs: 5:03 and $0.35.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 98.5 |  | 98.5 | honest ×1 | 4:07 | $0.16 | 98.5 | **102.8** | 103.5 |
| 2 | Glm 5.3 Flash (high) | Claude Code + OpenRouter | 97.5 |  | 97.5 | honest ×1 | 3:42 | $0.14 | 97.5 | **102.5** | 102.5 |
| 3 | Haiku 5.5 (high) | Claude Code | 94.5 |  | 94.5 | honest ×1 | 5:03 | $0.35 | 94.5 | **94.5** | 94.5 |
| 4 | Mistral Large 4 (high) | Claude Code + OpenRouter | 99 |  | 99 | honest ×1 | 9:02 | $0.59 | 99.0 | **94.3** | 94.0 |
| 5 | Mistral Large 4 (high) | Claude Code + OpenRouter | 98.5 |  | 98.5 | honest ×1 | 26:18 | $0.91 | 98.5 | **93.5** | 93.5 |

### Per model, across runs (MCP Recipe)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Glm 5.3 Flash (high) | 2 | 102.7 | 102.5–102.8 | 98.0 | 3:55 | $0.15 |
| Haiku 5.5 (high) | 1 | 94.5 | 94.5–94.5 | 94.5 | 5:03 | $0.35 |
| Mistral Large 4 (high) | 2 | 93.9 | 93.5–94.3 | 98.8 | 17:40 | $0.75 |
