"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@mikro-orm/core");
const express_1 = __importDefault(require("express"));
const constants_1 = require("./constants");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const apollo_server_express_1 = require("apollo-server-express");
const hello_1 = require("./resolvers/hello");
const type_graphql_1 = require("type-graphql");
const post_1 = require("./resolvers/post");
const users_1 = require("./resolvers/users");
const connect_redis_1 = __importDefault(require("connect-redis"));
const express_session_1 = __importDefault(require("express-session"));
const redis_1 = require("redis");
const apollo_server_core_1 = require("apollo-server-core");
const cors_1 = __importDefault(require("cors"));
const main = async () => {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    await orm.getMigrator().up;
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    const app = (0, express_1.default)();
    let redisClient = (0, redis_1.createClient)();
    redisClient.connect().catch(console.error);
    let redisStore = new connect_redis_1.default({
        client: redisClient,
        prefix: 'liredditApp',
        disableTouch: true,
    });
    app.use((0, cors_1.default)({
        origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
        credentials: true,
    }));
    app.use((0, express_session_1.default)({
        name: constants_1.COOKIE_NAME,
        store: redisStore,
        resave: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: 'lax',
            secure: constants_1.__prod__,
        },
        saveUninitialized: false,
        secret: 'likjvgkuyxcvuuyiviukjb',
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchemaSync)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, users_1.UserResolver],
        }),
        plugins: [(0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)()],
        context: ({ req, res }) => ({ em: orm.em, req, res }),
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
    app.listen(4000, () => {
        console.log('listening to port localhost:4000');
    });
};
main().catch((err) => {
    console.error(err);
});
//# sourceMappingURL=index.js.map