# Catalog API — Frontier workspace

The growing GraphQL project for the GraphQL Frontier roadmap. It starts as a one-field server and
accretes types, resolvers, mutations, subscriptions, security, and federation as you clear
exercises. **You** write the production code; exercises ship a failing test.

## Setup

```bash
cd workspace
npm install        # once
```

Requires **Node.js ≥ 20** (v22 LTS recommended).

## Commands

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Standalone Apollo Server 5 at http://localhost:4000 |
| `npm test`         | Run the Vitest suite once                           |
| `npm run test:watch` | Vitest in watch mode                              |
| `npm run typecheck`| `tsc --noEmit`                                      |

## Layout

```
src/
  schema.ts         SDL type definitions (the schema document)
  resolvers.ts      the resolver map
  schemaFactory.ts  builds the executable schema (used by server + tests)
  server.ts         Apollo Server 5 standalone entrypoint
test/
  helpers.ts        execute() — run an operation against the schema in-process
  seed.test.ts      smoke test
```

## Stack (current, non-deprecated)

`graphql` 16 · `@apollo/server` 5 (`startStandaloneServer`) · `@graphql-tools/schema` ·
`dataloader` · `graphql-ws`. Not used: `apollo-server*` (EOL), `subscriptions-transport-ws`
(archived).
