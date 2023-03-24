"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20230322202401 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20230322202401 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);');
        this.addSql('create table "users" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "username" text not null, "password" text not null);');
        this.addSql('alter table "users" add constraint "users_username_unique" unique ("username");');
    }
    async down() {
        this.addSql('drop table if exists "post" cascade;');
        this.addSql('drop table if exists "users" cascade;');
    }
}
exports.Migration20230322202401 = Migration20230322202401;
//# sourceMappingURL=Migration20230322202401.js.map