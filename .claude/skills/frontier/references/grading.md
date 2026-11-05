# Grading (two-tier)

AI graders drift lenient. Counteract deliberately. Both gates required for a pass:
the test/assertion is green AND the learner explained *why*.

## Tiers
- **Fluency tier** (recall, boilerplate, mechanics that should be automatic): run the test and
  record time-to-correct. Fast + correct -> push the review interval out (it's automatic).
  Slow + correct -> keep it in rotation (correct but not yet fluent). Timing modulates spacing.
- **Judgment tier** (design decisions, debugging unfamiliar failures, "which approach and why"):
  do NOT use the clock — thinking time on a novel problem is engagement, not weakness. Score the
  *quality of reasoning* and whether the learner transferred correctly. This is the real measure
  of competence; weight it accordingly.

## Default skeptical
- When unsure the understanding is real, it isn't a pass — ask one more probing question.
- Credit only what the learner produced, never what you explained.
- A green test by coincidence or copy-paste without explanation is a fail.

## Scoring
- Fluency tier: `fluency_ms` (median time-to-correct) + correctness.
- Judgment tier: `judgment` 0-5 (reasoning quality, see rubric in socratic.md).

## Recording a result (delegate the verdict to the `grader` subagent)
Apply the exact update rules in **DESIGN.md → "The update rules"** (authoritative); the named
constants (`s_init`, `stability_gain`, `encompass_credit`, `review_days`, `mastered_days`,
`fail_factor`, `s_floor`) are read from `settings.sr`, with their default values in DESIGN.md —
don't re-type the decimals here. A pass needs test green AND score ≥ 3.

On pass (compute `R` from the pre-review state, `t=0 ⇒ R=1`):
- `m = 1 + stability_gain·(2 − R)·perf·(11 − D)/10`; `S_new = S_old·m`; `last_seen = today`;
  `reps += 1`. The `(2 − R)` factor is the nearly-due bonus — low `R` at review earns a bigger
  jump. `perf`: fluency = 1.0 if time ≤ stored median `fluency_ms` else 0.5 (then update median);
  judgment = `judgment/5`. Top pass → `D −= 0.5` (floor 1).
- Each `encompasses` concept with an entry: `S_c ·= 1 + encompass_credit·(m_c − 1)` (never shrink),
  `last_seen = today`; no change to its `reps`/`state`.
- Derive `state`: `S ≥ mastered_days` AND tradeoff explained (score ≥ 4) → `mastered`;
  `review_days ≤ S < mastered_days` → `review`; else `learning`. `mastered` is sticky (only a fail
  demotes it). Remove from
  `due_for_review` only when `mastered`.
- If it was the module's boss and all module concepts are at least `review`, bump rank, `git tag`.
On fail (test red, or score ≤ 2):
- `S_new = max(s_floor, S_old·fail_factor)`, `D = min(10, D+1)`, `last_seen = today`, `reps`
  unchanged, add to `due_for_review`; optional light penalty: each direct prereq `S ·= 0.9`.
- Do NOT give the solution. Offer a smaller step or a narrower question.
- Commit with `result: fail` so the struggle is in history.

## Version drift
Fast-moving topics (k8s, GraphQL federation) teach deprecated patterns easily. When grading
infra/API usage, check it against current docs via web search before passing.
