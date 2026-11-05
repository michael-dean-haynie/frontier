---
description: Grade the current exercise two-tier (fluency timed, judgment untimed), propagate decay credit, record, commit.
allowed-tools: Bash, Read, Write, Edit, WebSearch, Task
---

Follow the `frontier` skill and `references/grading.md`.

1. **Objective gate.** Run the test/assertion. Show the result plainly.
   - Fluency tier: capture time-to-correct. Judgment tier: ignore the clock.

2. **Debrief (Socratic).** Why it worked, the tradeoff, when *not* to. One question at a time.
   For incident exercises, probe whether they discriminated the right concept. Don't accept
   "makes sense".

3. **Delegate the verdict** to the `grader` subagent (isolated, strict). Pass it: the test
   output, the `git diff` of `workspace/`, the debrief transcript, and the tier. It returns
   pass/fail, an articulation/judgment score, specific gaps, a version-drift check, and the
   ledger delta.

4. **Record.**
   - Write the full transcript (predict + debrief + grader notes) to `log/<id>.md`.
   - Apply the ledger delta by the fixed update rules (DESIGN.md → "The update rules"; summary in
     `references/grading.md`): on pass `S·=1+gain·(2−R)·perf·(11−D)/10`, fractional repetition to
     each `encompasses` concept, update `state`/`last_seen`/`reps`/`fluency_ms` or `judgment`; on
     fail `S=max(s_floor, S·fail_factor)`, `D+1`, add to due, light prereq penalty.
   - Append one record to `history.jsonl` — the authoritative progression log `/status` and
     `/next` read: `{id, date, module, concepts, tier, review_of, result,
     articulation|judgment, fluency_ms, struggled, self_rating}` (ask the learner for
     `self_rating`, 1-5). This is the time series, not git.
   - On a boss pass that clears the module, bump rank and `git tag <rank>`.

5. **Commit** workspace + ledger + log + history together: `<id>: <concepts> (<result>)`. The
   commit is a checkpoint and backup — nothing parses the message, so no trailers are needed.

6. Report the outcome; suggest `/next` (or `/review` if something is now due).
