"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20230503051928 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20230503051928 extends migrations_1.Migration {
    async up() {
        this.addSql('alter table "users" add column "email" text not null;');
        this.addSql('alter table "users" add constraint "users_email_unique" unique ("email");');
    }
    async down() {
        this.addSql('alter table "users" drop constraint "users_email_unique";');
        this.addSql('alter table "users" drop column "email";');
    }
}
exports.Migration20230503051928 = Migration20230503051928;
//# sourceMappingURL=Migration20230503051928.js.map