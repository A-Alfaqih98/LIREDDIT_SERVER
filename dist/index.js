"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@mikro-orm/core");
const express_1 = __importDefault(require("express"));
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const apollo_server_express_1 = require("apollo-server-express");
const hello_1 = require("./resolvers/hello");
const type_graphql_1 = require("type-graphql");
const post_1 = require("./resolvers/post");
const users_1 = require("./resolvers/users");
const main = async () => {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    await orm.getMigrator().up;
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    const app = (0, express_1.default)();
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchemaSync)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, users_1.UserResolver],
        }),
        context: () => ({ em: orm.em }),
    });
    await apolloServer.start();
    await apolloServer.applyMiddleware({ app });
    app.get('/', (_, res) => {
        res.status(201).send('Hello World!');
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