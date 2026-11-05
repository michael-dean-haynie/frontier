# GraphQL — Frontier roadmap

Mastering GraphQL from the type system up to a production, federated distributed graph, through
one growing API project in `workspace/`. The engine is the prerequisite graph in `graph.json` with
per-concept spaced-repetition decay (`ledger.json`); this file is the human-readable narrative.

## Environment prerequisites

The project you grow lives in `workspace/` and is a TypeScript + Apollo Server 5 GraphQL API.
Before `/next`:

- **Node.js ≥ 20** (v22 LTS recommended). `@apollo/server` v5 requires Node 20+.
- From `workspace/`, run **`npm install`** once (installs `graphql` 16, `@apollo/server` 5,
  `graphql-ws`, `dataloader`, and the dev toolchain: `typescript`, `tsx`, `vitest`).
- Tests run with **`npm test`** (Vitest). Exercises ship a failing test that stays red until you
  solve them. The dev server runs with **`npm run dev`** (standalone server on `:4000`).

Current, non-deprecated stack (verified Nov 2026):
- `@apollo/server` **v5** via `startStandaloneServer` — *not* the dead `apollo-server*` packages
  (Apollo Server 4 is EOL as of Jan 2026).
- Subscriptions over **`graphql-ws`** — *not* the archived `subscriptions-transport-ws`.
- Federation **v2** (opt-in via `@link`), composed with **`rover`**/managed composition.

## Why this order

GraphQL rewards a strict spine early and interleaving later. You cannot reason about resolver
execution before you can read a schema; you cannot see the N+1 problem before you understand the
resolver chain; you cannot design a federated graph before you can model relationships and
batch-load entities. Each rank below is a region of the graph ending in a **boss** concept that
encompasses the ones before it.

## Modules & ranks

### 🥉 Bronze — The type system
`type-system` · boss: **the-schema-document**

SDL, scalars, object types, field arguments, enums, lists and non-null wrappers, input objects,
interfaces, unions, custom scalars, and the three root types. You leave bronze able to write a
complete, well-formed schema document — the contract everything else resolves against.

### 🥈 Silver — Reading & writing data
`queries-resolvers`, `mutations-inputs` · boss: **mutation-payload-type**

How a query becomes data: the resolver signature (`parent, args, context, info`), the resolver
map, default property resolution, the resolver chain, per-request context, variables, aliases and
fragments, `info`, and booting Apollo Server 5. Then mutations: the single-input convention,
returning affected objects via a payload type, and mutation serial-execution semantics.

### 🥇 Gold — Execution semantics & the N+1 wall
`lists-nullability`, `n-plus-one-dataloader` · boss: **dataloader-per-request**

The two things that bite every real resolver tree: **nullability** (deliberate `!`, how a non-null
field error *propagates* up to the nearest nullable parent, list-vs-item nullability, partial
results) and the **N+1 problem** — diagnosing it, then DataLoader batching, per-request caching,
why you instantiate the loader per request in context, key-order batch functions, and `info`-driven
look-ahead. This is where naive GraphQL servers fall over.

### 💠 Platinum — Schema design & error modeling
`schema-design`, `error-handling` · boss: **relay-connections**

Designing for client use cases (not tables): naming, relationship modeling, offset → cursor →
**Relay connections** (edges/pageInfo), interface-vs-union judgment, global object identification,
input design. Then error modeling: the top-level `errors` array for the unexpected vs. typed
union/result types and `userErrors` payloads for expected domain outcomes — and where the boundary
between them lies.

### 💎 Diamond — Real-time & caching
`subscriptions`, `caching-performance` · boss: **subscription-scaling**

Subscriptions end to end: the operation, the subscribe/resolve async-iterator resolver, pub/sub
mechanics, the `graphql-ws` transport, and what breaks when you scale them (filtering, auth,
backpressure, multiple instances). Caching: full response caching, `@cacheControl` hints, automatic
persisted queries, and how per-request DataLoader cache relates to cross-request caches.

### 🧠 Master — Hardening for production
`security`, `schema-evolution`, `observability-testing` · boss: **production-readiness**

Security: auth in context, field-level authorization, depth limiting and why it misses *wide*
queries, complexity/cost analysis, introspection control, alias/batch abuse + rate limiting, and
persisted/trusted documents. Evolution: `@deprecated`, additive changes, breaking-change detection,
the versionless-API philosophy. Observability & testing: testing resolvers and schema contracts,
tracing/metrics, and error monitoring.

### 👑 Grandmaster — The distributed graph
`federation`, `production` · boss: **distributed-graph-mastery**

Federation v2: why/what, the `@link` subgraph schema, `@key` entities, `__resolveReference` (where
key-order batching returns!), `@shareable`/`@external`/`@override`, `@requires`/`@provides`,
supergraph composition and breaking-composition safeguards, and how the router plans queries across
subgraphs. The production capstones — performance budget, holistic API-design review, production
readiness — culminate in **distributed-graph-mastery**: a federated, performant, secure,
evolvable graph.

## The project

A small catalog API grows across the whole roadmap — think authors, books, reviews, and users.
It starts as a one-field server and accretes relationships (natural N+1), pagination, mutations,
subscriptions (new reviews), security, and finally splits into federated subgraphs. Every advanced
exercise re-exercises its fundamentals, which is how review credit trickles down the graph.
