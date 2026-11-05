import { defineConfig } from "vitest/config";

/**
 * Inline `graphql` and graphql-tools so a single instance of the `graphql` module
 * is shared between the test code and the schema builder. Without this, Vitest can
 * load two copies and graphql throws "Cannot use GraphQLSchema from another module
 * or realm."
 */
export default defineConfig({
  test: {
    server: {
      deps: {
        inline: [/^graphql$/, /@graphql-tools\//],
      },
    },
  },
});
