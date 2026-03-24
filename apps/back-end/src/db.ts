import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";
import { Kysely, Migrator, PostgresDialect } from "kysely";
import pg from "pg";
import * as migrations from "./migrations";

// ── Bitrix24 tables ──────────────────────────────────────────────

export interface Bitrix24Account {
  id: Generated<string>;
  b24_user_id: number;
  is_b24_user_admin: boolean;
  member_id: string;
  is_master_account: boolean | null;
  domain_url: string;
  status: string;
  application_token: string | null;
  created_at_utc: ColumnType<Date, Date | string, Date | string>;
  updated_at_utc: ColumnType<Date, Date | string, Date | string>;
  application_version: number;
  comment: string | null;
  auth_token_access_token: string | null;
  auth_token_refresh_token: string | null;
  auth_token_expires: string | null;
  auth_token_expires_in: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires: number | null;
  expires_in: number | null;
  application_scope_current_scope: unknown | null;
  current_scope: unknown | null;
}

export type SelectBitrix24Account = Selectable<Bitrix24Account>;
export type InsertBitrix24Account = Insertable<Bitrix24Account>;
export type UpdateBitrix24Account = Updateable<Bitrix24Account>;

export interface ApplicationInstallation {
  id: Generated<string>;
  status: string;
  created_at_utc: ColumnType<Date, Date | string, Date | string>;
  update_at_utc: ColumnType<Date, Date | string, Date | string>;
  bitrix_24_account_id: string;
  contact_person_id: string | null;
  bitrix_24_partner_contact_person_id: string | null;
  bitrix_24_partner_id: string | null;
  external_id: string | null;
  portal_license_family: string;
  portal_users_count: number | null;
  application_token: string | null;
  comment: string | null;
  status_code: unknown | null;
  application_status_status_code: unknown | null;
}

export type SelectApplicationInstallation = Selectable<ApplicationInstallation>;
export type InsertApplicationInstallation = Insertable<ApplicationInstallation>;
export type UpdateApplicationInstallation = Updateable<ApplicationInstallation>;

// ── Database schema ──────────────────────────────────────────────

export interface Database {
  bitrix24account: Bitrix24Account;
  application_installation: ApplicationInstallation;
}

// ── Connection ───────────────────────────────────────────────────

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "appdb",
    user: process.env.DB_USER ?? "appuser",
    password: process.env.DB_PASSWORD ?? "apppass",
    max: 10,
  }),
});

export const db = new Kysely<Database>({ dialect });

export async function runMigrations() {
  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        return migrations;
      },
    },
  });

  const { error, results } = await migrator.migrateToLatest();

  for (const result of results ?? []) {
    if (result.status === "Success") {
      console.log(`Migration "${result.migrationName}" executed successfully`);
    } else if (result.status === "Error") {
      console.error(`Migration "${result.migrationName}" failed`);
    }
  }

  if (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
