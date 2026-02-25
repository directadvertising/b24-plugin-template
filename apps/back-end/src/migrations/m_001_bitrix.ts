import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<Record<string, never>>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);

  await db.schema
    .createTable("bitrix24account")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn("b24_user_id", "integer", (col) => col.notNull())
    .addColumn("is_b24_user_admin", "boolean", (col) => col.notNull())
    .addColumn("member_id", "varchar", (col) => col.notNull())
    .addColumn("is_master_account", "boolean")
    .addColumn("domain_url", "varchar", (col) => col.notNull())
    .addColumn("status", "varchar", (col) => col.notNull())
    .addColumn("application_token", "varchar")
    .addColumn("created_at_utc", sql`timestamp(3)`, (col) => col.notNull())
    .addColumn("updated_at_utc", sql`timestamp(3)`, (col) => col.notNull())
    .addColumn("application_version", "integer", (col) => col.notNull())
    .addColumn("comment", "text")
    .addColumn("auth_token_access_token", "varchar")
    .addColumn("auth_token_refresh_token", "varchar")
    .addColumn("auth_token_expires", "bigint")
    .addColumn("auth_token_expires_in", "bigint")
    .addColumn("access_token", "varchar")
    .addColumn("refresh_token", "varchar")
    .addColumn("expires", "integer")
    .addColumn("expires_in", "integer")
    .addColumn("application_scope_current_scope", "json")
    .addColumn("current_scope", "json")
    .addUniqueConstraint("unique_b24_user_domain", [
      "b24_user_id",
      "domain_url",
    ])
    .execute();

  await db.schema
    .createTable("application_installation")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`uuid_generate_v4()`),
    )
    .addColumn("status", "varchar", (col) => col.notNull())
    .addColumn("created_at_utc", sql`timestamp(3)`, (col) => col.notNull())
    .addColumn("update_at_utc", sql`timestamp(3)`, (col) => col.notNull())
    .addColumn("bitrix_24_account_id", "uuid", (col) =>
      col
        .notNull()
        .unique()
        .references("bitrix24account.id")
        .onDelete("cascade"),
    )
    .addColumn("contact_person_id", "uuid")
    .addColumn("bitrix_24_partner_contact_person_id", "uuid")
    .addColumn("bitrix_24_partner_id", "uuid")
    .addColumn("external_id", "varchar")
    .addColumn("portal_license_family", "varchar", (col) => col.notNull())
    .addColumn("portal_users_count", "integer")
    .addColumn("application_token", "varchar")
    .addColumn("comment", "text")
    .addColumn("status_code", "json")
    .addColumn("application_status_status_code", "json")
    .execute();

  await db.schema
    .createIndex("idx_bitrix24account_member_id")
    .on("bitrix24account")
    .column("member_id")
    .execute();

  await db.schema
    .createIndex("idx_bitrix24account_domain_url")
    .on("bitrix24account")
    .column("domain_url")
    .execute();

  await db.schema
    .createIndex("idx_application_installation_status")
    .on("application_installation")
    .column("status")
    .execute();

  await db.schema
    .createIndex("idx_application_installation_portal_license_family")
    .on("application_installation")
    .column("portal_license_family")
    .execute();
}

export async function down(db: Kysely<Record<string, never>>): Promise<void> {
  await db.schema.dropTable("application_installation").execute();
  await db.schema.dropTable("bitrix24account").execute();
  await sql`DROP EXTENSION IF EXISTS "uuid-ossp"`.execute(db);
}
