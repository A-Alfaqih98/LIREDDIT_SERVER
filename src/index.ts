import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import express from 'express';
import { __prod__ } from './constants';
import mikroConfig from './mikro-orm.config';
import { ApolloServer } from 'apollo-server-express';
import { HelloResolver } from './resolvers/hello';
import { buildSchemaSync } from 'type-graphql';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/users';
import RedisStore from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';

const main = async () => {
  // intilizing orm and update / keep up schema
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up;
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();

  // Createing express server
  const app = express();

  // Running apollo server for graphql client
  const apolloServer = new ApolloServer({
    schema: await buildSchemaSync({
      resolvers: [HelloResolver, PostResolver, UserResolver],
    }),
    context: () => ({ em: orm.em }),
  });

  // Initialize client.
  let redisClient = createClient();
  redisClient.connect().catch(console.error);

  // Initialize store.
  let redisStore = new RedisStore({
    client: redisClient,
    prefix: 'myapp:',
  });

  // Initialize sesssion storage.
  app.use(
    session({
      store: redisStore,
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: 'keyboard cat',
    }),
  );

  await apolloServer.start();
  await apolloServer.applyMiddleware({ app });

  app.get('/', (_, res) => {
    res.status(201).send('Hello World!');
    res.end();
  });

  // Make the server listen to a port
  app.listen(4000, () => {
    console.log('listening to port localhost:4000');
  });
};

main().catch((err) => {
  console.error(err);
});
