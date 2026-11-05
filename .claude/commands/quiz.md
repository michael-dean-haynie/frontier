---
description: Rapid Socratic recall — a few questions, no code, feeds the spaced-repetition engine. Time-boxed; use when you only have a few minutes.
allowed-tools: Bash, Read, Write, Edit, WebSearch
argument-hint: "[count] (default 5; e.g. /quiz 3)"
---

Follow the `frontier` skill and `references/socratic.md`. This is the **lightweight** sibling of
`/next`: **no scenario, no failing test, no `workspace/` edits, no `/grade` afterward.** Just a
handful of recall/judgment questions that still update the ledger — for when there are only a few
minutes.

**Count.** `$ARGUMENTS` is how many concepts to quiz (default **5**). It may be a plain number
(`/quiz 3`) or a minutes budget (`/quiz 4m` → quiz until roughly that long, ~1 concept/min). Keep
it short; this mode is meant to be quick.

1. **Load state.** Read `ledger.json` (and `graph.json` for `encompasses`/prereqs). If `topic` is
   null or `concepts` is empty, there's nothing taught yet — say so and suggest `/roadmap`, stop.
   The quiz pool is **only concepts that already have a ledger entry** (i.e. introduced). Never
   quiz a `new` concept — introducing a concept is `/next`'s job, not a quiz's.

2. **Select the pool.** For each entry compute `R = target_retention ^ (days_since_last_seen /
   stability)`.
   - **First, due concepts** (`R < target_retention`), most overdue first (highest `t/stability`)
     — same priority as `/review`.
   - **Then backfill** to reach the requested count from the not-yet-due entries, nearest-to-due
     first (lowest `R`), breaking ties by longest since `last_seen`. This is the key difference
     from `/review`: a quiz always finds questions, even when nothing is strictly overdue.
   - Prefer **dissimilar** concepts together; don't quiz two tightly-linked concepts back to back.

3. **Ask — one question at a time** (`references/socratic.md`). Judgment tier: **do not time.**
   For each selected concept, one real recall/transfer question — *explain the mechanism*,
   *predict this small scenario*, or *when would this be the wrong choice?* Chase the "why" and
   the "when-not" with **at most one** follow-up if the answer is partial (this is quick, not a
   full debrief). Never reveal the answer before an attempt; if stuck, make the question smaller.
   Don't accept "makes sense" — make them say it back.

4. **Score each inline**, skeptical by default, against the 0–5 articulation rubric in
   `references/socratic.md`. No `grader` subagent — this is low-stakes and fast — but still grade
   hard: when unsure the understanding is real, it's not a pass. A pass needs score ≥ 3. (If a
   question touches a fast-moving API, sanity-check against current docs before passing.)

5. **Record — one history record per concept quizzed**, applying the exact judgment-tier update
   rules (DESIGN.md → "The update rules"; summary in `references/grading.md`), with `perf =
   judgment/5`, computing `R` from the pre-quiz state:
   - **Pass** (score ≥ 3): `S ·= 1 + stability_gain·(2 − R)·perf·(11 − D)/10`; `last_seen =
     today`; `reps += 1`; propagate fractional repetition to each `encompasses` concept that has
     an entry (`S_c ·= 1 + encompass_credit·(m_c − 1)`, never shrink, `last_seen = today`); derive
     `state`. A correct recall at low `R` earns the bigger jump — that's the whole point of
     quizzing what's slipping.
   - **Fail** (score ≤ 2): `S = max(s_floor, S·fail_factor)`, `D = min(10, D+1)`, `last_seen =
     today`, add to `due_for_review`. Don't give the answer; offer a narrower question.
   - Append to `history.jsonl`, one object per concept:
     `{id: "quiz-<date>-<n>", date, module, concepts: [c], tier: "quiz", review_of: c, result,
     judgment, struggled}`. (No `fluency_ms` — untimed. No `self_rating` prompt — keep it quick.)

6. **Commit** `ledger.json` + `history.jsonl` together: `quiz: <concepts> (<n> passed/<total>)`.
   No log transcript file and no rank/tag check — those belong to full exercises.

7. **Report**: a one-line scorecard (which concepts, pass/fail each), and note anything that just
   became due. Suggest `/next` to go deeper, or `/review` if a stack of things is overdue.
