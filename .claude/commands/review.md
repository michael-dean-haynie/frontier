---
description: Resurface concepts whose recall has decayed (spaced repetition), weighted by how overdue.
allowed-tools: Bash, Read, Write, Edit
---

Follow the `frontier` skill and `references/socratic.md`.

1. Read `ledger.json`. For each touched concept compute `R = target_retention ^ (days_since /
   stability)`. Collect those with `R < target_retention`, most overdue first.

2. Pick 1-3 (prefer dissimilar concepts together). For each, a quick **Socratic recall** (one
   question: explain it / predict a scenario) rather than a full exercise. Chase why + when-not.

3. Re-score, update `stability`, `last_seen`, `state` per the grading rules. A successful review
   at low retrievability earns a larger stability gain.

4. Append a record to `history.jsonl` (`tier: review`, the `articulation` score, `result`), then
   commit `review: <concepts>`. If nothing is due, say so and suggest `/next`.
