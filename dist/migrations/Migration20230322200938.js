"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20230322200938 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20230322200938 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "users" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null);');
        this.addSql('alter table "users" add constraint "users_username_unique" unique ("username");');
        this.addSql('drop table if exists "user" cascade;');
    }
    async down() {
        this.addSql('create table "user" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null);');
        this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
        this.addSql('drop table if exists "users" cascade;');
    }
}
exports.Migration20230322200938 = Migration20230322200938;
//# sourceMappingURL=Migration20230322200938.js.map