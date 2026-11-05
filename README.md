# Frontier

A reusable setup for mastering a technical topic through interdependent exercises in one growing
project, run inside Claude Code. **Frontier** is the tool (this template repo); each topic you
spin up is "your _&lt;topic&gt;_ frontier" (`graphql-frontier`, `docker-frontier`, …). Everything
about how it works lives in this repo as plain files
(`DESIGN.md`, `CLAUDE.md`, and the `.claude/` skill, commands, and agent) — no external tooling.

## Start a new topic
Get a fresh copy of this repo, whichever way you like:
- **Fork it** — or on GitHub use **"Use this template"** for a clean, history-free copy.
- **Copy the files** into a new empty repo: everything here except `.git/` (leave `log/` and
  `workspace/` empty).

Then open Claude Code in it and go:
```
/roadmap graphql     # research + build the knowledge graph for your topic (run once)
/next                # first exercise
```
Swap `graphql` for `temporal`, `kubernetes`, `docker`, anything. Each topic is its own repo; the
brain, its state, and its project history all live together.

## The loop
`/next` → answer the predict question, write code in `workspace/` → `/grade`. Repeat.
`/review` resurfaces decayed concepts · `/status` shows the map · `/retro` captures notes to
improve the system.

## See your frontier
[`FRONTIER.md`](FRONTIER.md) is a visual dashboard of the knowledge graph — rank progress and a
Mermaid map of every concept colored by state (mastered / edge / locked), rendered right on GitHub.
It's generated from `graph.json` + `ledger.json`, so regenerate it to refresh:
```
node tools/frontier-map.mjs              # rewrite FRONTIER.md
node tools/frontier-map.mjs --terminal   # colored summary in the terminal
```

## Updating a topic repo later
Improved this template? Copy its `.claude/` folder and the markdown docs over your topic repo's —
your `graph.json`, `ledger.json`, `history.jsonl`, `log/`, and `workspace/` are left untouched. `/retro` notes you
collect in a topic repo (`LEARNINGS.md`) are what you fold back into this template.

## What's in here
- `DESIGN.md` — how it works and why (the source of truth)
- `CLAUDE.md` — always-loaded flow + directives
- `.claude/skills/frontier/` — the method (SKILL.md + references)
- `.claude/commands/` — the verbs: roadmap, next, grade, review, status, retro
- `.claude/agents/grader.md` — the strict two-tier grader
- `graph.json` / `ledger.json` — the knowledge graph and per-concept state (generated/seeded)
- `history.jsonl` — append-only progression log; the time series `/status` and `/next` read
- `tools/frontier-map.mjs` — renders `FRONTIER.md` (and a terminal view) from the graph + ledger
- `FRONTIER.md` — generated visual dashboard of the frontier (Mermaid; renders on GitHub)
- `log/` · `workspace/` — transcripts · the one growing project

## Before you start
Some topics need a running environment (GraphQL server, Docker daemon, kind/minikube). `/roadmap`
lists prerequisites at the top of `roadmap.md`.
