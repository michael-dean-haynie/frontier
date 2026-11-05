---
description: Research the topic and build the knowledge graph, rank ladder, project seed, and ledger. Run once per repo.
argument-hint: <topic>
allowed-tools: Bash, WebSearch, WebFetch, Read, Write, Edit
---

Follow the `frontier` skill and `DESIGN.md`.

Build the Frontier system for topic: **$ARGUMENTS**

1. **Research the shape of expertise.** Web-search what practitioners find genuinely hard, the
   dependency order of concepts, common footguns, and the *current* versions/APIs (reject
   deprecated patterns). Cite what you relied on.

2. **Write `graph.json`** — the knowledge graph (~60-100 concepts across 10-14 modules):
   - per concept: `module`, `tier` (fluency|judgment), `difficulty` 1-10,
     `prereqs` (what must be mastered first), `encompasses` (simpler concepts implicitly
     practiced when this is exercised).
   - `ranks`: map graph regions to bronze->grandmaster, each ending in a boss concept.
   See the worked `graph.json` fragment in **DESIGN.md → "File formats (worked example)"** to copy
   the exact node/`ranks` shape. Also write `roadmap.md`: a human-readable narrative of the modules
   + the "why this order".

3. **Validate the graph before anything else uses it.** A malformed graph silently breaks the
   selector forever, so verify `graph.json` and *fix and re-check until clean* before moving on:
   - **Acyclic:** the `prereqs` + `encompasses` edges together must have no cycles (a true DAG).
   - **Referential integrity:** every id in any node's `prereqs`/`encompasses`, and every `boss` in
     `ranks`, must resolve to a real concept key.

   One robust check (run from the repo root; both lists must print `none`):

   ```bash
   python3 - <<'PY'
   import json
   g=json.load(open("graph.json")); c=g["concepts"]; ids=set(c)
   miss=[(k,r) for k,n in c.items() for r in n.get("prereqs",[])+n.get("encompasses",[]) if r not in ids]
   miss+=[("ranks:"+rk,b) for rk,rv in g.get("ranks",{}).items() if isinstance(rv,dict)
          for b in [rv.get("boss")] if b and b not in ids]
   col={k:0 for k in c}; cyc=[]
   def dfs(u,st):
       col[u]=1
       for v in c[u].get("prereqs",[])+c[u].get("encompasses",[]):
           if v not in c: continue
           if col[v]==1: cyc.append(st+[v]); return
           if col[v]==0: dfs(v,st+[v])
       col[u]=2
   for k in c:
       if col[k]==0: dfs(k,[k])
   print("UNRESOLVED:", miss or "none")
   print("CYCLES:", cyc or "none")
   PY
   ```

   If either is non-empty, repair the offending edges (drop/redirect the bad id, break the cycle by
   removing the back-edge that shouldn't be a prerequisite) and re-run until both say `none`.

4. **Scaffold the project.** Create the minimal seed in `workspace/` this topic's project will
   grow from. Note environment prerequisites (running server, Docker daemon, kind/minikube) at
   the top of `roadmap.md`.

5. **Seed `ledger.json`**: topic, `settings` (`mastery_gate`, `target_retention`,
   `interleave_rate`, the difficulty band, and the `sr` spaced-repetition constants) at the
   default values in **DESIGN.md** — the shipped seed `ledger.json` already carries them, so keep
   those numbers rather than re-deriving them here; empty `concepts`, `edge` = concepts with no
   prereqs, `rank: bronze`, `exercise_count: 0`. Create an empty `history.jsonl` (the progression
   log, appended one record per cleared exercise).

6. **Offer an entry diagnostic** — a short adaptive placement check (use the graph: probe a few
   mid-level concepts; if passed, mark their prereqs `mastered` to skip them). Ask before starting.

Commit everything: `chore: roadmap + graph for $ARGUMENTS`. Then tell them to run `/next`.
