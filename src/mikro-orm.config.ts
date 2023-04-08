import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';
import path from 'path';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import { Users } from './entities/Users';

export default {
  migrations: {
    pathTs: path.join(__dirname, './migrations'),
  },
  entities: [Post, Users],
  dbName: 'lireddit',
  type: 'postgresql',
  //debug: !__prod__,
  verbose: true,
  allowGlobalContext: true,
} as Parameters<typeof MikroORM.init>[0];
