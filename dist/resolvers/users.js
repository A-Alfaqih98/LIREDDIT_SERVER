"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const Users_1 = require("../entities/Users");
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
let FieldError = class FieldError {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    (0, type_graphql_1.ObjectType)()
], FieldError);
let UserResopnse = class UserResopnse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResopnse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => Users_1.Users, { nullable: true }),
    __metadata("design:type", Users_1.Users)
], UserResopnse.prototype, "user", void 0);
UserResopnse = __decorate([
    (0, type_graphql_1.ObjectType)()
], UserResopnse);
let UserResolver = class UserResolver {
    async me({ req, em }) {
        console.log(req.session);
        if (!req.session.userId) {
            return null;
        }
        const user = await em.findOne(Users_1.Users, { id: req.session.userId });
        return user;
    }
    async register(username, password, { em, req }) {
        if (username.length <= 2) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'length must be greater than 2',
                    },
                ],
            };
        }
        if (password.length <= 2) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'length must be greater than 2',
                    },
                ],
            };
        }
        const hashedPassword = await argon2_1.default.hash(password);
        const user = em.create(Users_1.Users, {
            username: username,
            password: hashedPassword,
        });
        try {
            await em.persistAndFlush(user);
        }
        catch (err) {
            if (err.code === '23505') {
            }
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'username already taken',
                    },
                ],
            };
        }
        req.session.userId = user.id;
        return { user };
    }
    async login(username, password, { em, req }) {
        const user = await em.findOne(Users_1.Users, { username: username });
        if (!user) {
            return {
                errors: [{ field: 'username', message: "that username doesn't exist" }],
            };
        }
        const valid = await argon2_1.default.verify(user.password, password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password',
                    },
                ],
            };
        }
        req.session.userId = user.id;
        console.log({ req: req.session });
        return {
            user,
        };
    }
};
__decorate([
    (0, type_graphql_1.Query)(() => Users_1.Users, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResopnse),
    __param(0, (0, type_graphql_1.Arg)('username')),
    __param(1, (0, type_graphql_1.Arg)('password')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResopnse),
    __param(0, (0, type_graphql_1.Arg)('username')),
    __param(1, (0, type_graphql_1.Arg)('password')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=users.js.map