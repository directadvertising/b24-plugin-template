import type { ColumnType, Generated, Selectable, Insertable, Updateable } from 'kysely';

// ─── bitrix24account ───────────────────────────────────────

export interface Bitrix24AccountTable {
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

export type Bitrix24Account = Selectable<Bitrix24AccountTable>;
export type NewBitrix24Account = Insertable<Bitrix24AccountTable>;
export type Bitrix24AccountUpdate = Updateable<Bitrix24AccountTable>;

// ─── application_installation ──────────────────────────────

export interface ApplicationInstallationTable {
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

export type ApplicationInstallation = Selectable<ApplicationInstallationTable>;
export type NewApplicationInstallation = Insertable<ApplicationInstallationTable>;
export type ApplicationInstallationUpdate = Updateable<ApplicationInstallationTable>;

// ─── Database ──────────────────────────────────────────────

export interface Database {
  bitrix24account: Bitrix24AccountTable;
  application_installation: ApplicationInstallationTable;
}
