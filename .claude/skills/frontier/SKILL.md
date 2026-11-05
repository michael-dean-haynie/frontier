---
name: frontier
description: "Frontier — a deliberate-practice engine for mastering a technical topic through interdependent exercises in one growing project, driven by a prerequisite knowledge graph with per-concept spaced-repetition decay. Use for any /roadmap, /next, /grade, /quiz, /review, /status, or /retro command in this repo, and whenever generating exercises, running Socratic sessions, grading, or tracking learning progression. Topic-agnostic: GraphQL, Temporal, Kubernetes, Docker, anything set by the roadmap."
---

# Frontier engine

Implements `DESIGN.md` (read it for rationale). The engine is a **prerequisite knowledge graph
with per-concept decay**, not a rating ladder. This skill is the methodology; the commands are
its verbs.

> Canonical values, defaults, and formulas live in **`DESIGN.md`** (seeded numbers also in
> `ledger.json → settings`). This skill restates the *concepts* and names the constants; it does
> not own the numbers. Change a value in `DESIGN.md` first — see its "Maintenance rule."

## Non-negotiables
- Never reveal a solution before an attempt — not in exercises, questions, or test files.
- The learner writes the production code. You write scenarios, tests, and questions.
- Two gates for any pass: the test is green AND the learner explained *why*. Grade hard.
- One Socratic question at a time (see `references/socratic.md`).

## Core model
- **One growing project** in `workspace/`. Exercise N builds on what N-1 left. Advanced
  exercises re-exercise their fundamentals — that's how review credit trickles down the graph.
- **Just-in-time.** The graph fixes concepts + order; individual exercises are generated one at
  a time, adapting to performance.

## Data files
- `graph.json` — the knowledge graph: per concept `module`, `tier` (fluency|judgment),
  `difficulty` 1-10, `prereqs` (extend the edge), `encompasses` (propagate review credit
  down). Plus `ranks` mapping graph regions to bronze->grandmaster.
- `ledger.json` — learner state. Per concept: `stability`, `difficulty`, `last_seen`, `reps`,
  `state` (new|learning|review|mastered), `fluency_ms`, `judgment`. Plus `settings`
  (`mastery_gate`, `target_retention`, `interleave_rate`, difficulty band), `edge`, `rank`,
  `exercise_count`.
- `history.jsonl` — append-only progression log, one record per cleared exercise; the time
  series `/status` and `/next` read (git is backup, not the query target).
- `log/<id>.md` — full Socratic transcript per exercise. `workspace/` — the project.

See **DESIGN.md → "File formats (worked example)"** for a concrete, copy-this fragment of each file
(a filled `graph.json` node, a `ledger.json` concept entry, and a `history.jsonl` record).

## Retrievability / due (compute on demand)
`R(t) = target_retention ^ (t / stability)`, `t` = days since `last_seen`.
A concept is **due** when `R < target_retention` (the setting) — equivalently `t > stability`.
Weight how overdue by `t / stability`. This decay replaces "losing rank" — stale fundamentals
resurface on their own.

## The update math (named constants from `settings.sr`; values & **authority** in DESIGN.md)
Fixed, reproducible; every `/grade` applies it identically. The constants below (`s_init`,
`stability_gain`, `encompass_credit`, `review_days`, `mastered_days`, `fail_factor`, `s_floor`)
are read from `settings.sr`; their defaults live in **DESIGN.md → "The update rules"** — don't
re-type the decimals here.
- **Seed (first pass):** `S = s_init`, `D =` graph `difficulty` (fallback 5), `reps = 1`,
  `last_seen = today`, `state = learning`.
- **Pass** (test green AND score ≥ 3): `m = 1 + stability_gain·(2 − R)·perf·(11 − D)/10`;
  `S_new = S_old·m`; `last_seen = today`; `reps += 1`; top pass → `D −= 0.5` (floor 1).
  `(2 − R)` is the nearly-due bonus (1 fresh → 2 fully decayed). `perf`: fluency = 1.0 if ≤ stored
  median `fluency_ms` (else 0.5), then update the median; judgment = `judgment/5`.
- **Fail** (test red or score ≤ 2): `S_new = max(s_floor, S_old·fail_factor)`, `D = min(10, D+1)`,
  `last_seen = today`, `reps` unchanged, add to due; optional direct-prereq `S ·= 0.9`.
- **State:** `learning` if `S < review_days`; `review` if `review_days ≤ S < mastered_days`;
  `mastered` if `S ≥ mastered_days` AND the tradeoff was explained (score ≥ 4). `mastered` is
  sticky; only a fail demotes it (→ `review`).

## The exercise loop (every exercise)
1. **Context** — current repo state + a realistic scenario grounded in `workspace/`.
2. **Predict (Socratic, before code)** — one question: what do you expect, why, what breaks?
   Wait. Don't reveal.
3. **Change** — learner edits `workspace/`.
4. **Verify** — a test/assertion shipped with the exercise, red until solved.
5. **Debrief (Socratic, after)** — why it worked, the tradeoff, when *not* to do it.

## Selecting the next exercise (`/next`)
In order: (1) **due reviews** (R < target), (2) **edge** (concepts whose prereqs are all
`mastered`, in roadmap order), (3) **interleave** — with `interleave_rate`, weave a review
concept into a new exercise instead of drilling it; prefer dissimilar concepts together, (4)
**difficulty target** — shape so expected success sits in the `difficulty_band` setting, (5) **incident exercises** —
periodically a novel scenario with the concept *unnamed*, forcing diagnosis (the transfer probe).
Block (drill one concept) only on first exposure; interleave thereafter. Managing expectation:
when interleaving, tell the learner it will feel harder and that's the point.

## Quick quiz (`/quiz`) — the lightweight path
A few rapid Socratic recall questions with **no code, no failing test, no `workspace/` edits, and
no `/grade` step** — for when there are only a few minutes. Unlike `/review` (which fires only on
concepts that have decayed past due), `/quiz [n]` always finds questions: it takes due concepts
first, then backfills from introduced concepts nearest to due. It only quizzes concepts that
already have a ledger entry — introducing a concept stays `/next`'s job. Each answer is scored
inline on the judgment rubric (no `grader` subagent) and **still updates the ledger** (judgment
tier, `perf = judgment/5`) and appends one `history.jsonl` record per concept (`tier: "quiz"`), so
the recall counts toward spaced repetition. Grade hard anyway — a quick quiz is not a soft one.

## Two-tier grading (`/grade`) — see `references/grading.md`
- **Fluency tier:** run the test, record time-to-correct. Fast+correct -> extend interval;
  slow+correct -> keep in rotation. Timing modulates spacing.
- **Judgment tier:** do NOT time. Score reasoning quality + correct transfer via the debrief and
  the `grader` subagent.

## Credit propagation (on grade)
- Pass: apply the pass update to the concept, then give each `encompasses` concept that already has
  an entry a fractional repetition — `S_c ·= 1 + encompass_credit·(m_c − 1)` (never shrinking) and
  `last_seen = today`; touches `S`/`last_seen` only, never `reps`/`state`. Credit trickles down.
- Fail: hold/lower `stability`, nudge `difficulty` up, add to due; optional light prereq penalty.

## Mastery gate (the one dial)
`settings.mastery_gate`: `strict` (advance only when prereqs `mastered`) or `loose` (advance at
`review`). Default strict. Respect it in edge selection.

## Progression record + git
Append one JSON object per cleared exercise to `history.jsonl` (`id`, `date`, `module`,
`concepts`, `tier`, `review_of`, `result`, `articulation`/`judgment`, `fluency_ms`, `struggled`,
`self_rating`) — the time series `/status` and `/next` read. Git is version control, not the
database: one commit per exercise (workspace + ledger + log + history) as a checkpoint/backup,
`git tag <rank>` on rank-up. Plain commit messages; nothing parses them.

## Evolving the system
`/retro` appends observations (bad difficulty calibration, weak questioning, confusing scenarios)
to `LEARNINGS.md`. Periodically fold `LEARNINGS.md` back into this skill / `DESIGN.md`.

## References
- `references/socratic.md` — running a Socratic session + articulation rubric.
- `references/grading.md` — two-tier grading rigor.
