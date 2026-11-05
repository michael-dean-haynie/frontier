# Entry diagnostic — 2026-11-04

Adaptive placement check run at roadmap time (4 Socratic probes). Scores are placement
judgments, not timed/scored exercise passes. Granted masteries below let the learner skip
demonstrated concepts; gaps become the starting frontier.

## Probes

**Probe 1 — N+1 / resolver execution (anchor, judgment).** `books { author { name } }`, 20 books.
- Learner: 1 + 20 = 21 calls; top-down resolver execution; scalar columns present on the parent
  row; FK follow-up per book; fix = DataLoader batching; admits never implemented; guessed the
  correctness requirement is "the key you batch by" (circled the right area).
- Verdict: **strong.** Owns `resolver-chain`, `default-resolvers`, `n-plus-one-problem`, and the
  whole execution spine. Gap: DataLoader hands-on, and specifically **batch-ordering** (values must
  be returned in key order) + **dataloader-per-request**.

**Probe 2 — nullability (judgment).** `Author.name: String!`, one null row.
- Learner: correct mixed `data`+`errors` response; stated propagation rule correctly ("non-null
  field that can't resolve → nearest nullable ancestor becomes null, error in errors array"); 200
  + errors convention; client must inspect. BUT concluded "the schema doesn't need to change" to
  stop one bad row blanking the list.
- Verdict: owns `nullability-semantics`, `null-propagation` (rule), `partial-results`, `errors-array`.
  Gap is precisely **list-nullability**: didn't trace `String!`→`Author!`→`[Book!]!`, where no
  nullable rung exists so the whole `data` nulls out — the fix is a schema change.

**Probe 3 — pagination (judgment).** 100k books.
- Learner: correct offset failure (insert/delete between pages → skip/duplicate); correct cursor
  *why* (stable pages). Connection shape described with page-number metadata (current/total pages)
  — the offset mental model leaking in; downside = cursor opacity.
- Verdict: owns `offset-pagination`, `cursor-pagination`. Gap: **relay-connections** exact spec
  (`Connection`/`Edge`/`pageInfo`) and why connections avoid page numbers.

**Probe 4 — mutations + error design (judgment).** `addReview`, one-review-per-user rule.
- Learner: input-type argument; payload/response type carrying `userErrors` as data + a `success`
  flag + created-object fields; correct expected-vs-unexpected boundary (actionable in-band data
  vs non-actionable top-level error when DB is down).
- Verdict: owns `mutation-operation`, `mutation-input-arg`, `mutation-payload-type`,
  `user-errors-payload`, and the error *boundary* judgment. Gap: **typed-errors-union** (the
  union-of-results alternative); `error-boundaries` left as target since it encompasses the union
  pattern not yet shown.

## Placement

- **Rank:** silver (bronze + silver bosses `the-schema-document`, `mutation-payload-type` placed
  mastered; gold boss `dataloader-per-request` not).
- **Mastered (28):** full type-system spine, resolver execution + chain + context + variables,
  mutations (operation/input/payload), nullability-semantics/null-propagation/partial-results,
  errors-array/user-errors-payload, n-plus-one-problem, offset/cursor pagination,
  relationships-modeling.
- **Left as frontier (not granted despite being nearby):** dataloader-* (incl. batch-ordering,
  per-request), list-nullability, relay-connections, typed-errors-union, error-boundaries,
  abstract types (interface/union/enum/custom-scalars — unprobed), apollo-server-setup (do it for
  real once), everything diamond-and-up.

No git rank tag created (tags are for rank-ups earned through the `/grade` loop).
