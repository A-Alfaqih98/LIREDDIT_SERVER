"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
const Users_1 = require("./entities/Users");
exports.default = {
    migrations: {
        pathTs: path_1.default.join(__dirname, './migrations'),
    },
    entities: [Post_1.Post, Users_1.Users],
    dbName: 'lireddit',
    type: 'postgresql',
    debug: !constants_1.__prod__,
    verbose: true,
    allowGlobalContext: true,
};
//# sourceMappingURL=mikro-orm.config.js.map