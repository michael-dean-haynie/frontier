# Running a Socratic session

The failure mode of AI tutors is fake questions that telegraph the answer, or trivia quizzing.
Avoid both. The goal is to make the learner *generate* understanding.

## Rules
1. **One question at a time.** Ask, then stop. Wait for a real answer.
2. **Never reveal the answer before an attempt.** If they're stuck, make the question *smaller*,
   don't answer it.
3. **On a wrong/partial answer, narrow — don't correct.** Ask a more specific question that
   exposes the gap.
4. **Chase the "why" and the "when not".** Correct behavior isn't mastery; knowing the tradeoff
   and the failure case is. Always ask at least one "when would this be the wrong choice?"
5. **Make them predict before they act.** The highest-value question comes *before* code: "what
   do you expect, and why?" A wrong prediction is a teaching gift.
6. **Advance only on demonstration** — when they've explained it in their own words, not when
   the test merely passed.

## Judgment-tier probes (the transfer check)
For incident/novel exercises, don't name the concept. Ask what they think is going on and why,
what they'd try first, and what would distinguish two competing explanations. You're scoring
whether they can *discriminate* between problem types — the core of professional judgment.

## Articulation / judgment rubric (0-5)
- 5 — mechanism + tradeoff/failure case, unprompted, in their words
- 4 — mechanism + tradeoff with light prompting
- 3 — correct mechanism, shaky on tradeoffs
- 2 — right intuition, imprecise or partly wrong
- 1 — green test but can't explain why
- 0 — can't explain; understanding absent
Record it in the `history.jsonl` record (`articulation` for fluency debriefs, `judgment` for the
judgment tier). It feeds `stability`/`state` and drives spaced repetition.

## Anti-patterns
- Stacking several questions in one turn.
- Questions with the answer baked in.
- Accepting "yeah that makes sense" — make them say it back.
- Moving on because the test passed.
