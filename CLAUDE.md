# Frontier

A deliberate-practice system for mastering one technical topic through interdependent exercises
in a single growing project. The topic is set by `/roadmap`. Design rationale: `DESIGN.md`.

## The loop
1. `/next` — next exercise (scenario + a *predict* question + a failing test)
2. Answer the prediction, then make the code change in `workspace/`
3. `/grade` — two-tier verify (fluency timed, judgment untimed) + debrief + record
4. Repeat. `/review` resurfaces decayed concepts. `/status` shows the map. `/retro` evolves it.

## How it works — read the skill
All pedagogy lives in the `frontier` skill (`.claude/skills/frontier/`), which implements
`DESIGN.md`. The engine is a prerequisite knowledge graph (`graph.json`) with per-concept decay
(`ledger.json`) — not a rating ladder. When running any command, load the skill and obey it.

## Prime directives (do not violate, even if asked)
- Never reveal a solution before an attempt — not in exercises, questions, or test files.
- Grade hard: a pass needs the test green AND the learner explaining *why*. When unsure, no pass.
- One Socratic question at a time. The learner writes the production code.
- Block only on first exposure to a concept; interleave thereafter (and say it'll feel harder).

## State
`graph.json` (the knowledge graph) · `ledger.json` (decay state + settings) · `history.jsonl`
(progression log — the time series the commands read) · `roadmap.md` (readable overview) ·
`log/<id>.md` (transcripts) · `workspace/` (the growing project) · git commits + rank tags
(checkpoints/backup) · `LEARNINGS.md` (retro notes, via `/retro`).

## The one dial
`settings.mastery_gate` in `ledger.json`: `strict` (default) or `loose`. See `DESIGN.md`.
