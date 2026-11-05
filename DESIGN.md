# DESIGN — the Frontier engine

This is the source of truth for how this system works and *why*. The `frontier` skill and the
commands implement it; when they and this doc disagree, this doc wins and the skill should be
fixed. It's deliberately topic-agnostic (GraphQL, Temporal, k8s, Docker, …).

**Maintenance rule (so copies don't drift).** The canonical home for every exact *value*,
*default*, and *formula* is this doc (the retrievability/update math below, the `settings`
defaults, the selector order). The seeded numbers also live as data in `ledger.json`
(`settings`). Everywhere else — the skill, the references, the commands — restates *concepts* for
teaching but points here with "per DESIGN.md → <section>" and references named constants
(`stability_gain`, `fail_factor`, …) instead of re-typing decimals. **To change a value or
formula: edit it here first, then update `ledger.json` if it's a seeded default, then check the
pointers still read true.** Don't copy a new decimal into another file.

## What this is

A deliberate-practice engine that takes a learner from zero to professional competence on one
topic through interdependent exercises in a single growing project. The goal is **durable,
transferable judgment** — the ability to make good decisions in novel situations — not the
ability to pass a fixed set of tests.

## Core principles (and the reasoning)

1. **The engine is a mastery graph with per-concept decay — not a rating ladder.** A global
   "MMR" is the wrong model: a solo learner grinds up and doesn't un-learn, so a two-way
   rating premised on regular losses doesn't fit. Instead, each concept has a memory state
   that *decays over time*; stale concepts become due and resurface. Nobody gets demoted — the
   map just shows what's fresh and what's faded.

2. **Coverage and adaptivity are not a tradeoff — the graph gives both.** A prerequisite DAG
   enforces coverage (you can't skip fundamentals; the map fills in — satisfying and linear
   where linearity matters), while mastery gates and spacing decide the *order and timing* of
   revisits (adaptive, non-linear). Linear spine, spaced revisits.

3. **Transfer is bought by interleaving and varied practice.** Mixing problem types forces the
   learner to *discriminate* between them — which is the foundation of judgment. The biggest
   gains show up on problems that require choosing the right strategy, not executing a known
   one. So the system deliberately interleaves and includes "incident" exercises where the
   learner is *not told* which concept applies.

4. **Desirable difficulty feels worse and is better — say so out loud.** Interleaved/varied
   practice makes sessions feel slower, error-prone, and less confident, while producing far
   better retention and transfer. Learners therefore *prefer* the worse method. The engine
   tells the learner this is happening, so the discomfort reads as working-as-intended.

5. **Assessment is two-tier.** Accuracy alone predicts neither retention nor transfer; fluency
   (correct *and* automatic) does. So fundamentals are timed; judgment is not (see below).

6. **Motivation is intrinsic-first.** Extrinsic reward scaffolding (XP, streaks, leaderboards)
   optimizes activity, not learning, and can crowd out intrinsic drive. The reward here is the
   map lighting up, the project getting more capable, and difficulty staying at the edge.

## The engine

### Knowledge graph (`graph.json`)

Built once by `/roadmap`. Each concept node has:
- `module`, `tier` (`fluency` | `judgment`), `difficulty` (1–10 intrinsic)
- `prereqs`: concepts that must be mastered first (the DAG — used to extend the edge)
- `encompasses`: simpler concepts implicitly practiced when this one is exercised (used to
  propagate spaced-repetition credit *downward*)

The two edge types are separate on purpose: prerequisites extend the edge forward (the set of
unlocked-but-untackled concepts); "encompassing" edges let an advanced exercise pay down the
review debt of its fundamentals.

### Per-concept memory state (`ledger.json`)

Each concept the learner has touched carries an FSRS-style state:
- `stability` (S): days for recall probability to fall to the target retention
- `difficulty` (D): learner-specific difficulty, 1–10
- `last_seen`, `reps`, `state` (`new|learning|review|mastered`)
- `fluency_ms`: median time-to-correct on fluency checks (fluency tier only)
- `judgment`: 0–5 reasoning quality on novel items (judgment tier only)

**Retrievability** is computed on demand: `R(t) = target_retention ^ (t / S)`, where `t` is
days since `last_seen`. A concept is **due** when `R < target_retention` (default 0.9) — which,
because `tr^(t/S) < tr ⟺ t > S`, is simply **`t > S`**: once more days have passed than the
stability, it resurfaces. Weight how overdue by `t / S` (stability-lengths past due). This is
the decay that replaces "losing rank."

### The update rules (concrete defaults)

These are the fixed, reproducible formulas every `/grade` and `/review` applies identically. The
constants live in `settings.sr` (tuning knobs, not sacred — see below). Defaults:
`s_init 2.0`, `stability_gain 1.0`, `encompass_credit 0.5`, `review_days 7`, `mastered_days 21`,
`fail_factor 0.5`, `s_floor 0.5`.

**Seeding (first pass on a brand-new concept).** Create the ledger entry with
`S = s_init = 2.0` days, `D =` the concept's intrinsic `difficulty` from `graph.json` (1–10,
fallback 5), `reps = 1`, `last_seen = today`, `state = learning`. (A never-touched concept has no
entry and is `new`.)

**Pass / fail boundary.** A pass requires *both* gates: test green AND a debrief score ≥ 3 (the
0–5 rubric in `socratic.md`). Test red, or score ≤ 2, is a fail.

**Pass update.** Compute `R` at review time from the *previous* state (`t` = days since
`last_seen`; `t = 0 ⇒ R = 1`). Then grow stability by a multiplier:

```
m     = 1 + stability_gain · (2 − R) · perf · (11 − D)/10
S_new = S_old · m           (m ≥ 1, so stability only grows on a pass)
```

Each factor is interpretable: `(2 − R)` is the **nearly-due bonus** — 1.0 when the concept is
fresh (`R → 1`), up to 2.0 when it had fully decayed (`R → 0`), so an overdue pass earns the
bigger jump; `(11 − D)/10` damps growth for hard concepts (≈1.0 at `D=1`, 0.1 at `D=10`); `perf`
is performance (below). Set `last_seen = today`, `reps += 1`. On a top pass (fluency = fast, or
judgment score 5) nudge `D −= 0.5` (floor 1); otherwise leave `D`.

**`perf` by tier.**
- *Fluency tier* — `perf = 1.0` if this attempt's time is ≤ the concept's stored median
  `fluency_ms` (or there's no prior measurement), else `0.5` (correct but not yet automatic →
  keep it in rotation). Then update `fluency_ms` toward this attempt (running mean:
  `(old + this)/2`, or `this` if unset).
- *Judgment tier* — `perf = judgment / 5` (do not use the clock). Record `judgment` 0–5.

**Fail update.** `S_new = max(s_floor, S_old · fail_factor)` (halve the interval, floor 0.5 d so
it resurfaces within a session); `D = min(10, D + 1)`; `last_seen = today`; `reps` unchanged
(reps count successful recalls); add to `due_for_review`. Keep it light — don't give the
solution, offer a smaller step. *Optional light prereq penalty:* each direct prereq `S ·= 0.9`.

**State as a function of state.** After any update, derive `state` from `S` and the latest pass:
`learning` while `S < review_days (7)`; `review` while `7 ≤ S < mastered_days (21)`; `mastered`
once `S ≥ 21` **and** the learner explained the tradeoff (pass score ≥ 4). `mastered` is sticky —
later passes keep it; only a *fail* demotes it (→ `review`). The S-thresholds naturally require
several successful reps to clear, so no separate rep counter gates promotion.

### Credit propagation

- **Pass:** apply the pass update above to the graded concept. Then give each `encompasses`
  concept that already has a ledger entry a **fractional repetition** worth `encompass_credit`
  (0.5): `S_c_new = max(S_c_old, S_c_old · (1 + 0.5 · (m_c − 1)))`, where `m_c` is that concept's
  own pass multiplier (its `R`, its `D`, `perf = 1`); and refresh `last_seen = today` (paying down
  its review debt — the main effect). Fractional credit touches `S` and `last_seen` only — never
  `reps` or `state` (mastery requires a real, articulated pass). Credit trickles down, never up.
- **Fail:** the fail update above — hold/reduce `stability`, nudge `difficulty` up, add to
  `due_for_review`, optional light prereq penalty. Penalties travel up; keep them light.

## The selector (`/next`)

Pick the next exercise by, in order:
1. **Due reviews** — any concept with `R < target_retention`, weighted by how overdue.
2. **Edge** — concepts whose prereqs are all `mastered`; pick the next one in roadmap order.
3. **Interleave** — with probability `interleave_rate` (default ~0.4), weave a *review* concept
   into a *new* exercise rather than drilling it alone. Prefer dissimilar concepts together
   (non-interference) so recall isn't blurred.
4. **Difficulty target** — choose/shape the exercise so expected success sits near the edge
   (~75–85%): hard enough to be desirable, not so hard it's noise.
5. **Incident exercises** — periodically present a novel scenario in the growing project
   *without naming the concept*, forcing diagnosis. These are the transfer/judgment probes.

Block (drill one concept repeatedly) **only** on first exposure to a brand-new concept; switch
to interleaving as soon as the basic representation exists.

## Two-tier assessment (`/grade`)

- **Fluency tier** (recall, boilerplate, mechanics that should become automatic): run the test,
  record time-to-correct. Fast + correct → push the review interval out further; slow + correct
  → keep it in rotation (it's not automatic yet). Timing modulates spacing here.
- **Judgment tier** (design decisions, debugging unfamiliar failures, "which approach and why"):
  **do not time the clock** — thinking time on a novel problem is engagement, not weakness.
  Score the quality of reasoning and whether the learner transferred correctly, via the Socratic
  debrief + the grader subagent. This tier is the real measure of competence.

Both gates still apply to anything code: the test must be green *and* the learner must explain
why. See `references/grading.md`.

## The one dial: the mastery gate

`settings.mastery_gate` in the ledger:
- `strict` — can't advance to a concept until all prereqs are `mastered` (rigorous
  foundations, can feel gate-y).
- `loose` — advance when prereqs are merely `review`-level (more momentum, shakier base).

Expose it, don't hard-code it. Default `strict`. Everything else (target retention, interleave
rate, difficulty target band) is a tuning knob in `settings`, not a core change.

## Ranks (the visible skin)

`bronze → silver → gold → platinum → diamond → master → grandmaster`, mapped to graph regions
in `graph.json.ranks`. A rank-up is an *informational milestone tied to demonstrated mastery*,
never to activity. Tag the repo on rank-up (`git tag <rank>`). Keep ranks as motivation, but
remember the engine underneath is the graph + decay, not a competitive ladder.

## The progression record (`history.jsonl`) and git

The authoritative progression record is `history.jsonl`: one appended JSON object per cleared
exercise (`id`, `date`, `module`, `concepts`, `tier`, `review_of`, `result`,
`articulation`/`judgment`, `fluency_ms`, `struggled`, `self_rating`). `/status` and `/next` read
its tail for trends and recency — a structured file Claude reads deterministically, rather than
git trailers parsed back out of the log (fragile, and a rebase or a malformed trailer silently
corrupts it). `log/<id>.md` holds the full Socratic transcript so *how well a concept was
articulated* is recoverable, not just pass/fail.

Git is version control, not the database: one commit per cleared exercise (workspace + ledger +
log + history) as a checkpoint and backup, and `git tag <rank>` to mark rank-ups. Nothing parses
commit messages, so keep them plain.

## File formats (worked example)

Canonical, copy-this reference for the three data files. The topic and concept ids below are
generic placeholders (`primitives`, `basic-composition`, …) — a real `/roadmap` run replaces them
with the actual topic's concepts. Keep real seed files empty (`topic: null`); `/roadmap` fills them.

**`graph.json`** — built once by `/roadmap`. Concept ids are the keys; every id in any `prereqs`,
`encompasses`, or `ranks` must resolve to another key, and the `prereqs`+`encompasses` edges must
form a DAG (no cycles):

```json
{
  "topic": "example-topic",
  "concepts": {
    "primitives": {
      "module": "fundamentals", "tier": "fluency", "difficulty": 2,
      "prereqs": [], "encompasses": []
    },
    "basic-composition": {
      "module": "fundamentals", "tier": "fluency", "difficulty": 4,
      "prereqs": ["primitives"], "encompasses": ["primitives"]
    },
    "design-tradeoffs": {
      "module": "architecture", "tier": "judgment", "difficulty": 7,
      "prereqs": ["basic-composition"], "encompasses": ["primitives", "basic-composition"]
    }
  },
  "ranks": {
    "bronze": { "modules": ["fundamentals"],  "boss": "basic-composition" },
    "silver": { "modules": ["architecture"],  "boss": "design-tradeoffs" }
  }
}
```

**`ledger.json`** — `settings` (seeded by `/roadmap`, see above) plus one `concepts` entry per
*touched* concept (a never-touched concept has no entry and is `new`). Values below are consistent
with the `settings.sr` math — a fluency concept drilled into `review`, and a judgment concept still
`learning`. `fluency_ms` appears on fluency-tier entries only; `judgment` (0–5) on judgment-tier
only:

```json
{
  "concepts": {
    "primitives": {
      "stability": 9.4, "difficulty": 1.5, "last_seen": "2026-10-28",
      "reps": 4, "state": "review", "fluency_ms": 4200
    },
    "design-tradeoffs": {
      "stability": 5.0, "difficulty": 7, "last_seen": "2026-11-01",
      "reps": 2, "state": "learning", "judgment": 4
    }
  },
  "edge": ["design-tradeoffs"],
  "due_for_review": [],
  "exercise_count": 12
}
```

**`history.jsonl`** — one JSON object per line, appended per cleared exercise. Fluency records carry
`articulation` + `fluency_ms`; judgment records carry `judgment` and no clock:

```jsonl
{"id":"ex-007","date":"2026-10-28","module":"fundamentals","concepts":["basic-composition","primitives"],"tier":"fluency","review_of":["primitives"],"result":"pass","articulation":4,"fluency_ms":4200,"struggled":false,"self_rating":3}
{"id":"ex-012","date":"2026-11-01","module":"architecture","concepts":["design-tradeoffs"],"tier":"judgment","review_of":[],"result":"pass","judgment":4,"struggled":true,"self_rating":4}
```

## Anti-patterns (do not build)

- Streaks or XP that measure activity instead of mastery (invites speed-running / Goodhart).
- Global leaderboards. The only opponent is the learner's own git history.
- Permanent penalties. A decayed concept resurfacing is a prompt, never a demotion.
- Revealing a solution before an attempt. Ever.
- Blocking past first exposure. After the first rep, interleave.

## Tuning knobs / open questions
All in `settings` — defaults, exposed for tuning, not sacred:
- `target_retention` (0.9) trades review volume against retention.
- `interleave_rate` and the difficulty-target band shape the grind/flow balance.
- `settings.sr`: `s_init` (2.0), `stability_gain` (1.0, overall pass growth), `encompass_credit`
  (0.5, fractional credit down `encompasses` edges), `review_days`/`mastered_days` (7/21, the
  state thresholds), `fail_factor` (0.5) and `s_floor` (0.5). Start here; tune against history.
- Whether to fit per-learner decay from history once there's enough log data.
