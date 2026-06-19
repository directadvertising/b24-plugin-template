import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface BitrixUser {
  id: Generated<string>;
  bitrix_id: number;
  is_admin: boolean;
  member_id: string;
  domain: string;
  status: string;
  app_version: number;
  access_token: string | null;
  refresh_token: string | null;
  expires_in: number | null;
  created_at: ColumnType<Date, Date | string, Date | string>;
  updated_at: ColumnType<Date, Date | string, Date | string>;
}

export type SelectBitrixUser = Selectable<BitrixUser>;
export type InsertBitrixUser = Insertable<BitrixUser>;
export type UpdateBitrixUser = Updateable<BitrixUser>;
