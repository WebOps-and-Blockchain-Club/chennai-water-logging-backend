import { ApolloServer } from "apollo-server-express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import dotenv from "dotenv";
import resolvers from "./resolvers";
import entities from "./entities";
import express from "express";
import cors from "cors";
import { graphqlUploadExpress } from "graphql-upload";
import { FILE_SIZE_LIMIT_MB } from "./utils/config";

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
    graphqlUploadExpress({
      maxFileSize: FILE_SIZE_LIMIT_MB * 1000000, // 10MB
      maxFiles: 1,
    })
  );

  app.use(
    cors({
      credentials: true,
      origin: ["https://studio.apollographql.com", "http://localhost:8000"],
    })
  );

  server.applyMiddleware({ app, cors: false });

  app.use(express.static("public"));

  app.listen(8000, () =>
    console.log(`🚀 Server ready at http://localhost:8000${server.graphqlPath}`)
  );
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
