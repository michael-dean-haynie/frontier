import { graphql, type ExecutionResult } from "graphql";
import { buildSchema } from "../src/schemaFactory.js";

/**
 * Execute a GraphQL operation against the project's executable schema, without a
 * network server. Exercise tests use this to assert on `data` and `errors`.
 *
 * @param source     the operation document (query/mutation/subscription string)
 * @param variables  optional operation variables
 * @param contextValue optional per-request context (auth, loaders, …)
 */
export function execute(
  source: string,
  variables?: Record<string, unknown>,
  contextValue?: unknown,
): Promise<ExecutionResult> {
  return graphql({
    schema: buildSchema(),
    source,
    variableValues: variables,
    contextValue,
  });
}
