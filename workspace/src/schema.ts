/**
 * The schema document for the catalog API.
 *
 * This is the seed: a single root field so the server boots and tests can run.
 * You will grow this schema one exercise at a time — new types, fields, arguments,
 * mutations, and eventually a federated subgraph.
 */
export const typeDefs = /* GraphQL */ `
  type Query {
    """A liveness probe. Returns a constant so the seed is a valid, runnable schema."""
    ping: String!
  }
`;
