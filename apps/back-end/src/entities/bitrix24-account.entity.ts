import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

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
