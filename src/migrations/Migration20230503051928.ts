import { Migration } from '@mikro-orm/migrations';

export class Migration20230503051928 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "users" add column "email" text not null;');
    this.addSql('alter table "users" add constraint "users_email_unique" unique ("email");');
  }

  async down(): Promise<void> {
    this.addSql('alter table "users" drop constraint "users_email_unique";');
    this.addSql('alter table "users" drop column "email";');
  }

}
