import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import express from 'express';
import { COOKIE_NAME, __prod__ } from './constants';
import mikroConfig from './mikro-orm.config';
import { ApolloServer } from 'apollo-server-express';
import { HelloResolver } from './resolvers/hello';
import { buildSchemaSync } from 'type-graphql';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/users';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';
import session from 'express-session';
import { MyContext } from './types';
import {
  ApolloServerPluginInlineTrace,
  // ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';
import cors from 'cors';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const main = async () => {
  // intilizing orm and update / keep up schema

  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up;
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();

  // Createing express server
  const app = express();

  // Initialize client.

  const redis = new Redis();

  // Initialize store.
  let redisStore = new RedisStore({
    client: redis,
    prefix: 'liredditApp',
    disableTouch: true,
  });

  // Allow cors for the client
  app.use(
    cors({
      origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
      credentials: true,
    }),
  );

  // Initialize sesssion storage.
  app.use(
    session({
      name: COOKIE_NAME,
      store: redisStore,
      resave: false, // required: force lightweight session keep alive (touch)
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax', //csrf
        secure: __prod__, //cookie only works in https
      },
      saveUninitialized: false, // recommended: only save session when data exists
      secret: 'likjvgkuyxcvuuyiviukjb',
    }),
  );

  // Running apollo server for graphql client
  const apolloServer = new ApolloServer({
    schema: await buildSchemaSync({
      resolvers: [HelloResolver, PostResolver, UserResolver],
    }),

    // plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    plugins: [ApolloServerPluginInlineTrace()],
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis }),
  });

  await apolloServer.start();
  await apolloServer.applyMiddleware({
    app,
    cors: {
      origin: false,
    },
  });

  app.get('/', (_, res) => {
    res.redirect('/graphql');
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
