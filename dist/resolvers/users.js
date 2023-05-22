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
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const validateRigester_1 = require("../utils/validateRigester");
const sendEmail_1 = require("../utils/sendEmail");
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
    async changePassword(token, newPassword, { redis, em, req }) {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'length must be greater than 2',
                    },
                ],
            };
        }
        const userId = await redis.get(constants_1.FORGET_PASSWORD_PEFIX + token);
        if (!userId) {
            return { errors: [{ field: 'token', message: 'token expired' }] };
        }
        const user = await em.findOne(Users_1.Users, { id: parseInt(userId, 10) });
        if (!user) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'user no loger exist',
                    },
                ],
            };
        }
        user.password = await argon2_1.default.hash(newPassword);
        await em.persistAndFlush(user);
        req.session.userId = user.id;
        return { user };
    }
    async forgotPassword(email, { em, redis }) {
        email = email.toLocaleLowerCase();
        const user = await em.findOne(Users_1.Users, { email });
        if (!user) {
            return true;
        }
        const token = (0, uuid_1.v4)({});
        await redis.set(constants_1.FORGET_PASSWORD_PEFIX + token, user.id, 'EX', 60 * 60 * 24 * 3);
        await (0, sendEmail_1.sendEmail)(email, `<a href="http://localhost:3000/change-password/${token}">reset passord</a>`);
        return true;
    }
    async me({ req, em }) {
        if (!req.session.userId) {
            return null;
        }
        const user = await em.findOne(Users_1.Users, { id: req.session.userId });
        return user;
    }
    async register(username, email, password, { em, req }) {
        username = username.toLocaleLowerCase();
        email = email.toLocaleLowerCase();
        const hashedPassword = await argon2_1.default.hash(password);
        let user;
        try {
            const errors = (0, validateRigester_1.validateRigester)(username, email, password);
            if (errors) {
                return { errors };
            }
            const result = await em
                .createQueryBuilder(Users_1.Users)
                .getKnexQuery()
                .insert({
                username,
                email: email,
                password: hashedPassword,
                created_at: new Date(),
                updated_at: new Date(),
            })
                .returning('*');
            user = result[0];
        }
        catch (err) {
            if (err.code === '23505') {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'username already taken',
                        },
                    ],
                };
            }
        }
        req.session.userId = user.id;
        return { user };
    }
    async login(usernameOrEmail, password, { em, req }) {
        const user = await em.findOne(Users_1.Users, usernameOrEmail.includes('@')
            ? { email: usernameOrEmail.toLocaleLowerCase() }
            : { username: usernameOrEmail.toLocaleLowerCase() });
        if (!user) {
            return {
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: "that username or email doesn't exist",
                    },
                ],
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
    async logout({ req, res }) {
        return new Promise((resolve) => {
            req.session.destroy((err) => {
                res.clearCookie(constants_1.COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResopnse),
    __param(0, (0, type_graphql_1.Arg)('token')),
    __param(1, (0, type_graphql_1.Arg)('newPassword')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)('emial')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
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
    __param(1, (0, type_graphql_1.Arg)('email')),
    __param(2, (0, type_graphql_1.Arg)('password')),
    __param(3, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResopnse),
    __param(0, (0, type_graphql_1.Arg)('usernameOrEmail')),
    __param(1, (0, type_graphql_1.Arg)('password')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=users.js.map