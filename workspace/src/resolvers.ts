/**
 * The resolver map — wires schema fields to the functions that produce their values.
 *
 * Seed: just the `ping` resolver. You will add resolvers alongside the schema as the
 * project grows.
 */
export const resolvers = {
  Query: {
    ping: () => "pong",
  },
};
