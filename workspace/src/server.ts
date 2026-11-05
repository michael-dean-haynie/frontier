import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSchema } from "./schemaFactory.js";

/**
 * Apollo Server 5, standalone. Run with `npm run dev`.
 *
 * As the project grows you'll build a per-request `context` here (auth, DataLoaders,
 * data sources) and pass it to startStandaloneServer's `context` option.
 */
const server = new ApolloServer({
  schema: buildSchema(),
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 GraphQL server ready at ${url}`);
