---
description: Generate the next exercise, adapting to progress (due reviews, edge, interleaving, difficulty target).
allowed-tools: Bash, Read, Write, Edit, WebSearch
---

Follow the `frontier` skill (exercise loop + selector + `references/socratic.md`).

1. Read `graph.json`, `ledger.json`, and the tail of `history.jsonl` (recent exercises — to avoid
   repetition and see what's recently been interleaved). Compute retrievability for touched
   concepts: `R = target_retention ^ (days_since_last_seen / stability)`.

2. **Select** (in order): due reviews (R < target) -> edge (prereqs all `mastered`, respect
   `mastery_gate`) -> with `interleave_rate`, weave a review concept into a new exercise (prefer
   dissimilar concepts) -> shape difficulty so expected success sits in the `difficulty_band`
   setting (see DESIGN.md) -> periodically an
   **incident exercise**: a novel scenario with the concept unnamed, forcing diagnosis.
   Block only on first exposure to a brand-new concept.

3. **Produce the exercise**, grounded in current `workspace/` state:
   - Print: id, concept(s), tier, scenario, and the **predict question** (one Socratic question).
     For an incident exercise, do NOT name the concept.
   - Write the **failing test/assertion** into `workspace/` (red until solved).
   - Do NOT write or hint at the solution.
   - If interleaving, note briefly that this will feel harder and that's intended.

4. Stop after the predict question and wait. After they answer, let them code, then say `/grade`.
