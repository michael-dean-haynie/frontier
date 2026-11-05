---
description: Show rank, edge, map coverage, concepts due for review, and recent judgment trend.
allowed-tools: Bash, Read
---

Follow the `frontier` skill. Read `graph.json` + `ledger.json` + `history.jsonl`, show a concise board:

- **Rank** + progress to next (modules/concepts mastered vs total from `graph.json`).
- **Edge** — what's unlocked and next (your frontier: unlocked, not yet mastered).
- **Map coverage** — mastered / review / new / untouched counts.
- **Due now** — concepts with `R < target_retention`, most overdue first (compute on the fly).
- **Judgment trend** — recent `judgment` scores from the tail of `history.jsonl`, and the direction.
- **Counts** — `exercise_count`, recent pass/fail from `history.jsonl` `result`s; `git tag` (ranks climbed).

Keep it scannable. Suggest the next action (`/next` or `/review`).
