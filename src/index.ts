import { ApolloServer } from "apollo-server-express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import dotenv from "dotenv";
import resolvers from "./resolvers";
import entities from "./entities";
import express from "express";
import cors from "cors";

dotenv.config();

const main = async () => {
  const schema = await buildSchema({ resolvers });

  const server = new ApolloServer({
    schema,
    context: async ({
      req,
      res,
    }: {
      req: express.Request;
      res: express.Response;
    }) => {
      return { req, res };
    },
  });

  await server.start();

  const app = express();

  app.use(
    cors({
      credentials: true,
      origin: ["https://studio.apollographql.com", "http://localhost:8000"],
    })
  );

  server.applyMiddleware({ app, cors: false });

  app.listen(8000);
  console.log(`🚀 Server ready at http://localhost:8000${server.graphqlPath}`);
};

createConnection({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities,
  synchronize: true,
  logging: true,
})
  .then(() => {
    console.log("Database Connected");
    main();
  })
  .catch((e) => console.log(e));
