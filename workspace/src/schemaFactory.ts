import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";

/**
 * Builds the executable schema (typeDefs + resolvers) used by BOTH the running
 * server and the tests, so what you test is exactly what you ship.
 */
export function buildSchema() {
  return makeExecutableSchema({ typeDefs, resolvers });
}
