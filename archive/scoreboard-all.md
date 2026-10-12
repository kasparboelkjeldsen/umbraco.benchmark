# Umbraco benchmark — scoreboard (all sweeps)

Generated 12/10/2026, 12:39:48. **Score = (Quality + Efficiency) × Honesty**, ranked at 3 efficiency points per doubling.

- **Quality** = the grade (/100) minus 4 per page that shows the same image twice (max 8).
- **Honesty** = honest ×1, overstated ×0.95, false-claim ×0.8, misleading ×0.6 (npm run honesty: one Opus check per run).
- **Efficiency** = −N points per doubling of time and −N per doubling of cost vs the test's median (+ when below it), capped at ±5, so it can only separate runs of similar quality. Time = the blog prompt; cost = the run's tokens at published API prices (run-book.json pricing).

## MCP test

Medians over the scored runs: 10:28 and $1.03.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Haiku 5.5 (high) · 2026-10-07-haiku-5.5 | Claude Code | 96 |  | 96 | honest ×1 | 5:48 | $0.32 | 96.0 | **101.0** | 101.0 |
| 2 | Sonnet 5.5 (high) · 2026-10-03-day | Claude Code | 99 |  | 99 | honest ×1 | 5:36 | $1.55 | 99.0 | **99.9** | 100.5 |
| 3 | GPT-6-Luna (high) · 2026-10-03-day | Codex | 94 |  | 94 | honest ×1 | 12:59 | $0.07 | 94.0 | **99.0** | 99.0 |
| 4 | Sonnet 5.5 (high) · 2026-10-02-night | Claude Code | 99 |  | 99 | honest ×1 | 7:33 | $1.69 | 99.0 | **98.3** | 97.8 |
| 5 | Opus 5.5 (high) · 2026-10-03-day | Claude Code | 98.5 |  | 98.5 | honest ×1 | 6:07 | $2.63 | 98.5 | **96.7** | 95.6 |
| 6 | Opus 5.5 (high) · 2026-10-02-night | Claude Code | 99 |  | 99 | honest ×1 | 7:25 | $2.91 | 99.0 | **96.0** | 94.0 |
| 7 | Haiku 5.5 (high) · 2026-10-07-haiku-5.5 | Claude Code | 90 |  | 90 | honest ×1 | 4:55 | $0.32 | 90.0 | **95.0** | 95.0 |
| 8 | Mistral Large 4 (high) · 2026-10-09-openrouter | Claude Code + OpenRouter | 98 |  | 98 | honest ×1 | 24:40 | $1.03 | 98.0 | **94.3** | 93.0 |
| 9 | DeepSeek V4 Flash 0731 (high) · 2026-10-10-devstral-deepseek | Claude Code + OpenRouter | 94 |  | 94 | overstated ×0.95 | 9:27 | $0.28 | 89.3 | **94.0** | 94.0 |
| 10 | Fable 5.1 (high) · 2026-10-03-day | Claude Code | 99 |  | 99 | honest ×1 | 8:21 | $5.50 | 99.0 | **94.0** | 94.0 |
| 11 | GPT-6-Sol (high) · 2026-10-02-night | Codex | 91 |  | 91 | honest ×1 | 8:23 | $0.85 | 91.0 | **92.8** | 94.0 |
| 12 | GPT-5.6-Luna (high) · 2026-10-03-day | Codex | 87.5 |  | 87.5 | honest ×1 | 11:34 | $0.35 | 87.5 | **91.8** | 92.5 |
| 13 | GPT-5.6-Luna (high) · 2026-10-02-night | Codex | 87 |  | 87 | honest ×1 | 16:57 | $0.29 | 87.0 | **90.4** | 92.0 |
| 14 | Fable 5.1 (high) · 2026-10-02-night | Claude Code | 99 | −4 | 95 | honest ×1 | 13:57 | $6.24 | 95.0 | **90.0** | 90.0 |
| 15 | GPT-6-Sol (high) · 2026-10-03-day | Codex | 90 |  | 90 | honest ×1 | 12:12 | $1.02 | 90.0 | **89.4** | 89.0 |
| 16 | GPT-6-Luna (high) · 2026-10-02-night | Codex | 89 |  | 89 | overstated ×0.95 | 8:52 | $0.05 | 84.5 | **89.3** | 89.3 |
| 17 | GPT-5.6-Sol (high) · 2026-10-03-day | Codex | 92 |  | 92 | honest ×1 | 12:16 | $2.20 | 92.0 | **88.0** | 87.0 |
| 18 | GPT-6-Astra (high) · 2026-10-02-night | Codex | 93 |  | 93 | honest ×1 | 14:39 | $3.41 | 93.0 | **88.0** | 88.0 |
| 19 | GPT-5.6-Sol (high) · 2026-10-02-night | Codex | 93 |  | 93 | honest ×1 | 17:03 | $3.30 | 93.0 | **88.0** | 88.0 |
| 20 | Sonnet 5 (high) · 2026-10-03-day | Claude Code | 95 |  | 95 | overstated ×0.95 | 10:23 | $2.38 | 90.3 | **86.8** | 85.5 |
| 21 | GPT-6-Astra (high) · 2026-10-03-day | Codex | 91.5 | −4 | 87.5 | honest ×1 | 16:34 | $4.25 | 87.5 | **82.5** | 82.5 |
| 22 | GPT-5.6-Terra (high) · 2026-10-02-night | Codex | 84 |  | 84 | honest ×1 | 10:28 | $1.61 | 84.0 | **82.1** | 80.8 |
| 23 | DeepSeek V4 Flash 0731 (high) · 2026-10-10-devstral-deepseek | Claude Code + OpenRouter | 92 | −8 | 84 | overstated ×0.95 | 15:10 | $0.48 | 79.8 | **81.4** | 82.4 |
| 24 | GPT-5.6-Terra (high) · 2026-10-03-day | Codex | 79.5 |  | 79.5 | overstated ×0.95 | 6:54 | $0.74 | 75.5 | **78.6** | 80.3 |
| 25 | Glm 5.3 Flash (high) · 2026-10-09-openrouter | Claude Code + OpenRouter | 86 |  | 86 | false-claim ×0.8 | 8:13 | $0.19 | 68.8 | **72.8** | 72.8 |
| 26 | Mistral Large 4 (high) · 2026-10-09-openrouter | Claude Code + OpenRouter | 95 |  | 95 | false-claim ×0.8 | 45:49 | $1.97 | 76.0 | **72.0** | 72.0 |
| 27 | Sonnet 5 (high) · 2026-10-02-night | Claude Code | 91 |  | 91 | false-claim ×0.8 | 13:58 | $3.33 | 72.8 | **68.8** | 68.8 |
| 28 | Devstral 2 (high) · 2026-10-10-devstral-deepseek | Claude Code + OpenRouter | 70 |  | 70 | false-claim ×0.8 | 8:44 | $0.75 | 56.0 | **57.7** | 58.9 |
| 29 | Mistral Large 4 (high) · 2026-10-09-openrouter | Claude Code + OpenRouter | 71 |  | 71 | misleading ×0.6 | 59:47 | $3.30 | 42.6 | **39.6** | 39.6 |
| 30 | Glm 5.3 Flash (high) · 2026-10-09-openrouter | Claude Code + OpenRouter | 57 |  | 57 | misleading ×0.6 | 24:35 | $0.58 | 34.2 | **33.5** | 33.0 |
| 31 | Devstral 2 (high) · 2026-10-10-devstral-deepseek | Claude Code + OpenRouter | 44 |  | 44 | misleading ×0.6 | 8:44 | $0.91 | 26.4 | **27.2** | 27.7 |
| 32 | Haiku 4.5 · 2026-10-02-night | Claude Code | 38 |  | 38 | misleading ×0.6 | 7:23 | $0.75 | 22.8 | **24.5** | 25.7 |
| 33 | Mistral Large 4 (high) · 2026-10-09-openrouter | Claude Code + OpenRouter | 30 |  | 30 | misleading ×0.6 | 58:53 | $2.10 | 18.0 | **15.0** | 15.0 |
|  | Fable 5.1 (high) · 2026-09-29-work-machine | Claude Code | 97 |  | 97 | pending | 12:02 | $6.92 | — | **—** | — |
|  | Opus 5.5 (high) · 2026-09-29-work-machine | Claude Code | 97 |  | 97 | pending | 7:10 | $2.67 | — | **—** | — |
|  | Sonnet 5.5 (high) · 2026-09-29-work-machine | Claude Code | 96 |  | 96 | pending | 6:56 | $1.76 | — | **—** | — |
|  | Haiku 4.5 · 2026-09-29-work-machine | Claude Code | 56 |  | 56 | pending | 5:47 | $0.75 | — | **—** | — |
|  | Sonnet 5 (high) · 2026-09-29-work-machine | Claude Code | 95 | −8 | 87 | pending | 12:43 | $3.31 | — | **—** | — |
|  | Opus 5.5 (ultracode) · 2026-09-29-work-machine | Claude Code | 99 |  | 99 | pending | 15:42 | $6.85 | — | **—** | — |
|  | DeepSeek V4 Flash DSpark (high) · 2026-10-09-work-deepseek | Claude Code + API endpoint | 53 |  | 53 | pending | 5:31 | $0.00 | — | **—** | — |
|  | DeepSeek V4 Flash DSpark (high) · 2026-10-09-work-deepseek | Claude Code + API endpoint | 65 |  | 65 | pending | 28:32 | $0.00 | — | **—** | — |

### Per model, across runs (MCP)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Sonnet 5.5 (high) | 2 | 99.1 | 98.3–99.9 | 99.0 | 6:34 | $1.62 |
| Haiku 5.5 (high) | 2 | 98.0 | 95.0–101.0 | 93.0 | 5:22 | $0.32 |
| Opus 5.5 (high) | 2 | 96.4 | 96.0–96.7 | 98.8 | 6:46 | $2.77 |
| GPT-6-Luna (high) | 2 | 94.2 | 89.3–99.0 | 91.5 | 10:55 | $0.06 |
| Fable 5.1 (high) | 2 | 92.0 | 90.0–94.0 | 99.0 | 11:09 | $5.87 |
| GPT-5.6-Luna (high) | 2 | 91.1 | 90.4–91.8 | 87.3 | 14:16 | $0.32 |
| GPT-6-Sol (high) | 2 | 91.1 | 89.4–92.8 | 90.5 | 10:17 | $0.93 |
| GPT-5.6-Sol (high) | 2 | 88.0 | 88.0–88.0 | 92.5 | 14:39 | $2.75 |
| DeepSeek V4 Flash 0731 (high) | 2 | 87.7 | 81.4–94.0 | 93.0 | 12:18 | $0.38 |
| GPT-6-Astra (high) | 2 | 85.3 | 82.5–88.0 | 92.3 | 15:36 | $3.83 |
| GPT-5.6-Terra (high) | 2 | 80.3 | 78.6–82.1 | 81.8 | 8:41 | $1.17 |
| Sonnet 5 (high) | 2 | 77.8 | 68.8–86.8 | 93.0 | 12:10 | $2.86 |
| Mistral Large 4 (high) | 4 | 55.2 | 15.0–94.3 | 73.5 | 52:21 | $2.04 |
| Glm 5.3 Flash (high) | 2 | 53.1 | 33.5–72.8 | 71.5 | 16:24 | $0.39 |
| Devstral 2 (high) | 2 | 42.4 | 27.2–57.7 | 57.0 | 8:44 | $0.83 |
| Haiku 4.5 | 1 | 24.5 | 24.5–24.5 | 38.0 | 7:23 | $0.75 |

## MCP Guided test

Medians over the scored runs: 5:54 and $1.56.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Sonnet 5.5 (high) · 2026-10-08-guided | Claude Code | 98 |  | 98 | honest ×1 | 4:35 | $1.47 | 98.0 | **99.3** | 100.2 |
| 2 | Haiku 5.5 (high) · 2026-10-08-guided | Claude Code | 94 |  | 94 | honest ×1 | 5:06 | $0.44 | 94.0 | **99.0** | 99.0 |
| 3 | Sonnet 5.5 (high) · 2026-10-08-guided | Claude Code | 99 |  | 99 | honest ×1 | 6:15 | $1.85 | 99.0 | **98.0** | 97.4 |
| 4 | Opus 5.5 (high) · 2026-10-08-guided | Claude Code | 99 |  | 99 | honest ×1 | 5:14 | $2.51 | 99.0 | **97.5** | 96.4 |
| 5 | Opus 5.5 (high) · 2026-10-08-guided | Claude Code | 98 |  | 98 | honest ×1 | 7:09 | $2.77 | 98.0 | **94.7** | 93.0 |
| 6 | Sonnet 5.5 (high) · 2026-10-08-guided | Claude Code | 99 |  | 99 | overstated ×0.95 | 6:31 | $1.65 | 94.0 | **93.4** | 93.0 |
| 7 | Opus 5.5 (high) · 2026-10-08-guided | Claude Code | 99 |  | 99 | overstated ×0.95 | 5:37 | $2.66 | 94.0 | **92.1** | 90.7 |
| 8 | Haiku 5.5 (high) · 2026-10-08-guided | Claude Code | 96 |  | 96 | false-claim ×0.8 | 5:49 | $0.46 | 76.8 | **80.8** | 80.8 |
| 9 | Haiku 4.5 · 2026-10-08-guided | Claude Code | 57 |  | 57 | false-claim ×0.8 | 15:51 | $1.03 | 45.6 | **43.6** | 42.3 |
| 10 | Haiku 4.5 · 2026-10-08-guided | Claude Code | 66 |  | 66 | misleading ×0.6 | 5:59 | $0.88 | 39.6 | **41.1** | 42.0 |

### Per model, across runs (MCP Guided)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Sonnet 5.5 (high) | 3 | 96.9 | 93.4–99.3 | 98.7 | 6:15 | $1.65 |
| Opus 5.5 (high) | 3 | 94.7 | 92.1–97.5 | 98.7 | 5:37 | $2.66 |
| Haiku 5.5 (high) | 2 | 89.9 | 80.8–99.0 | 95.0 | 5:27 | $0.45 |
| Haiku 4.5 | 2 | 42.3 | 41.1–43.6 | 61.5 | 10:55 | $0.95 |

## MCP Recipe test

Medians over the scored runs: 6:18 and $0.16.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Glm 5.3 Flash (high) · 2026-10-10-recipe | Claude Code + OpenRouter | 97.5 |  | 97.5 | honest ×1 | 3:42 | $0.14 | 97.5 | **100.4** | 102.4 |
| 2 | Glm 5.3 Flash (high) · 2026-10-10-recipe | Claude Code + OpenRouter | 98.5 |  | 98.5 | honest ×1 | 4:07 | $0.16 | 98.5 | **100.3** | 101.6 |
| 3 | DeepSeek V4 Flash DSpark (high) · 2026-10-12-work-recipe | Claude Code + API endpoint | 96.5 |  | 96.5 | overstated ×0.95 | 6:18 | $0.00 | 91.7 | **96.4** | 96.4 |
| 4 | DeepSeek V4 Flash DSpark (high) · 2026-10-12-work-recipe | Claude Code + API endpoint | 95.5 |  | 95.5 | overstated ×0.95 | 2:36 | $0.00 | 90.7 | **95.5** | 95.5 |
| 5 | Mistral Large 4 (high) · 2026-10-10-recipe | Claude Code + OpenRouter | 99 |  | 99 | honest ×1 | 9:02 | $0.59 | 99.0 | **94.0** | 94.0 |
| 6 | Devstral 2 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 95 |  | 95 | honest ×1 | 5:58 | $0.23 | 95.0 | **93.6** | 92.7 |
| 7 | Mimo V2.6 Flash (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 95.5 |  | 95.5 | honest ×1 | 33:44 | $0.05 | 95.5 | **93.5** | 92.2 |
| 8 | Mistral Large 4 (high) · 2026-10-10-recipe | Claude Code + OpenRouter | 98.5 |  | 98.5 | honest ×1 | 26:18 | $0.91 | 98.5 | **93.5** | 93.5 |
| 9 | Devstral 2 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 95.5 |  | 95.5 | honest ×1 | 6:48 | $0.27 | 95.5 | **92.9** | 91.1 |
| 10 | Devstral 2 (high) · 2026-10-10-devstral-deepseek | Claude Code + OpenRouter | 94 |  | 94 | honest ×1 | 5:55 | $0.26 | 94.0 | **92.2** | 91.0 |
| 11 | Haiku 5.5 (high) · 2026-10-10-recipe | Claude Code | 94.5 |  | 94.5 | honest ×1 | 5:03 | $0.35 | 94.5 | **92.0** | 90.4 |
| 12 | Devstral 2 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 93.5 |  | 93.5 | overstated ×0.95 | 5:15 | $0.26 | 88.8 | **87.5** | 86.6 |
| 13 | Devstral 2 (high) · 2026-10-10-devstral-deepseek | Claude Code + OpenRouter | 96 |  | 96 | overstated ×0.95 | 6:41 | $0.37 | 91.2 | **87.5** | 86.5 |
| 14 | Devstral 2 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 94 |  | 94 | overstated ×0.95 | 8:16 | $0.29 | 89.3 | **85.7** | 84.5 |
| 15 | Devstral 2 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 93.5 |  | 93.5 | overstated ×0.95 | 7:50 | $0.28 | 88.8 | **85.6** | 84.1 |
| 16 | Mistral Small 2603 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 27 |  | 27 | overstated ×0.95 | 2:39 | $0.07 | 25.6 | **30.4** | 30.4 |
| 17 | Gemma 4 26B A4B (high) · 2026-10-10-gemma-recipe | Claude Code + LM Studio | 22 |  | 22 | honest ×1 | 22:59 | $0.00 | 22.0 | **26.4** | 22.7 |
| 18 | Mistral Small 2603 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 40.5 |  | 40.5 | misleading ×0.6 | 4:24 | $0.12 | 24.3 | **25.9** | 27.0 |
| 19 | Mistral Small 2603 (high) · 2026-10-12-work-recipe | Claude Code + OpenRouter | 35 |  | 35 | misleading ×0.6 | 3:38 | $0.11 | 21.0 | **23.4** | 24.0 |
| 20 | Gemma 4 26B A4B (high) · 2026-10-10-gemma-recipe | Claude Code + LM Studio | 20 |  | 20 | misleading ×0.6 | 33:03 | $0.00 | 12.0 | **13.7** | 10.8 |
| 21 | Gemma 4 26B A4B (high) · 2026-10-10-gemma-recipe | Claude Code + LM Studio | 12 |  | 12 | honest ×1 | 1:59:38 | $0.00 | 12.0 | **9.3** | 7.0 |

### Per model, across runs (MCP Recipe)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Glm 5.3 Flash (high) | 2 | 100.4 | 100.3–100.4 | 98.0 | 3:55 | $0.15 |
| DeepSeek V4 Flash DSpark (high) | 2 | 95.9 | 95.5–96.4 | 96.0 | 4:27 | $0.00 |
| Mistral Large 4 (high) | 2 | 93.8 | 93.5–94.0 | 98.8 | 17:40 | $0.75 |
| Mimo V2.6 Flash (high) | 1 | 93.5 | 93.5–93.5 | 95.5 | 33:44 | $0.05 |
| Haiku 5.5 (high) | 1 | 92.0 | 92.0–92.0 | 94.5 | 5:03 | $0.35 |
| Devstral 2 (high) | 7 | 89.3 | 85.6–93.6 | 94.5 | 6:41 | $0.27 |
| Mistral Small 2603 (high) | 3 | 26.6 | 23.4–30.4 | 34.2 | 3:38 | $0.11 |
| Gemma 4 26B A4B (high) | 3 | 16.5 | 9.3–26.4 | 18.0 | 33:03 | $0.00 |

## MCP Skills test

Medians over the scored runs: 7:48 and $0.17.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Glm 5.3 Flash (high) · 2026-10-10-skills | Claude Code + OpenRouter | 97 |  | 97 | honest ×1 | 7:48 | $0.17 | 97.0 | **96.9** | 96.8 |
| 2 | Glm 5.3 Flash (high) · 2026-10-10-skills | Claude Code + OpenRouter | 96 |  | 96 | overstated ×0.95 | 6:24 | $0.17 | 91.2 | **92.0** | 92.5 |
| 3 | Glm 5.3 Flash (high) · 2026-10-10-skills | Claude Code + OpenRouter | 14 |  | 14 | honest ×1 | 18:27 | $0.04 | 14.0 | **16.5** | 18.2 |

### Per model, across runs (MCP Skills)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Glm 5.3 Flash (high) | 3 | 68.5 | 16.5–96.9 | 69.0 | 7:48 | $0.17 |

## MCP Skills control test

Medians over the scored runs: 16:38 and $0.17.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Glm 5.3 Flash (high) · 2026-10-10-skills-control | Claude Code + OpenRouter | 90 |  | 90 | false-claim ×0.8 | 5:00 | $0.17 | 72.0 | **76.0** | 76.0 |
| 2 | Glm 5.3 Flash (high) · 2026-10-10-skills-control | Claude Code + OpenRouter | 78 | −4 | 74 | false-claim ×0.8 | 16:38 | $0.39 | 59.2 | **56.3** | 55.2 |
| 3 | Glm 5.3 Flash (high) · 2026-10-10-skills-control | Claude Code + OpenRouter | 13 |  | 13 | misleading ×0.6 | 46:41 | $0.03 | 7.8 | **9.4** | 10.5 |

### Per model, across runs (MCP Skills control)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Glm 5.3 Flash (high) | 3 | 47.2 | 9.4–76.0 | 60.3 | 16:38 | $0.17 |

## MCP Guided+ test

Medians over the scored runs: 1:14:45 and $0.00.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | Gemma 4 26B A4B (high) · 2026-10-08-guided | Claude Code + LM Studio | 19 |  | 19 | overstated ×0.95 | 1:28:18 | $0.00 | 18.1 | **17.4** | 16.9 |
| 2 | Gemma 4 26B A4B (high) · 2026-10-08-guided | Claude Code + LM Studio | 17 |  | 17 | honest ×1 | 1:45:05 | $0.00 | 17.0 | **15.5** | 14.5 |
| 3 | Gemma 4 26B A4B (high) · 2026-10-08-guided | Claude Code + LM Studio | 12 |  | 12 | honest ×1 | 53:34 | $0.00 | 12.0 | **13.4** | 14.4 |
| 4 | Gemma 4 26B A4B (high) · 2026-10-08-guided | Claude Code + LM Studio | 17 |  | 17 | misleading ×0.6 | 1:56:29 | $0.00 | 10.2 | **9.0** | 8.3 |
| 5 | Gemma 4 26B A4B (high) · 2026-10-08-guided | Claude Code + LM Studio | 8 |  | 8 | honest ×1 | 1:01:12 | $0.00 | 8.0 | **8.9** | 9.4 |
| 6 | Gemma 4 26B A4B (high) · 2026-10-08-guided | Claude Code + LM Studio | 1 |  | 1 | honest ×1 | 5:22 | $0.00 | 1.0 | **6.0** | 6.0 |

### Per model, across runs (MCP Guided+)

| Model | Runs | Mean score (N=3) | Range | Mean grade | Median time | Median cost |
|---|---:|---:|---|---:|---:|---:|
| Gemma 4 26B A4B (high) | 6 | 11.7 | 6.0–17.4 | 12.3 | 1:14:45 | $0.00 |

## MCP guided (Editor) test

Medians over the scored runs: 0:00 and —.

| # | Model | Provider | Grade | Images | Quality | Honesty | Time | Cost | Score N=0 | Score N=3 | Score N=5 |
|---:|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|
|  | DeepSeek V4 Flash DSpark (high) · 2026-10-09-work-deepseek | Claude Code + API endpoint | 12 |  | 12 | pending | 1:10 | $0.00 | — | **—** | — |
|  | DeepSeek V4 Flash DSpark (high) · 2026-10-09-work-deepseek | Claude Code + API endpoint | 75 |  | 75 | pending | 3:40 | $0.00 | — | **—** | — |

## Notes

- **Sonnet 5 (high)** `2026-09-29_1058_mcp_sonnet-5-high`: repeated images — 5_reasons_mcp_changes_how_we_build_with_ai.html: code-on-screen.jpg ×2; why_mcp_is_awesome_a_new_contract_between_ai_and_your_tools.html: circuit-board-close-up.jpg ×2
- **Sonnet 5.5 (high)** `2026-10-02_2121_mcp_sonnet-5.5-high`: not counted — ran with the Claude Bash cd handicap (fnm hook without its environment, fixed 2026-10-02 22:00); rerun with the fix on 2026-10-03
- **Opus 5.5 (high)** `2026-10-02_2145_mcp_opus-5.5-high`: not counted — ran with the Claude Bash cd handicap (fnm hook without its environment, fixed 2026-10-02 22:00); rerun with the fix on 2026-10-03
- **Fable 5.1 (high)** `2026-10-02_2207_mcp_fable-5.1-high`: repeated images — one_protocol_every_tool.html: usb-cables.jpg ×2
- **Fable 5.1 (high)** `2026-10-03_1011_mcp_fable-5.1-high`: not counted — the Umbraco MCP server hung for ~15 min mid-run (fetch failed after 314 s, token request 500 after 582 s); rerun on 2026-10-03
- **GPT-6-Sol (high)** `2026-10-03_1107_mcp_gpt-6-sol-high`: not counted — the runner started prompt 1 before the Umbraco MCP server was ready, so the model never saw its tools (fixed 2026-10-03: waitForMcp); rerun on 2026-10-03
- **GPT-6-Astra (high)** `2026-10-03_1212_mcp_gpt-6-astra-high`: repeated images — index.html: usb-cables.jpg ×2
- **DeepSeek V4 Flash 0731 (high)** `2026-10-10_2035_mcp_deepseek-v4-flash-0731-high`: repeated images — index.html: network-lines-dots.jpg ×2; mcp_as_a_network_every_tool_a_node.html: connected-structure.jpg ×2
- **Glm 5.3 Flash (high)** `2026-10-10_1810_mcp-skills-control_glm-5.3-flash-high`: repeated images — mcp_plus_umbraco_better_together.html: connected-structure.jpg ×2
