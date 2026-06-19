import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface BitrixTenant {
  id: Generated<string>;
  bitrix_user_id: string;
  status: string;
  license_family: string;
  created_at: ColumnType<Date, Date | string, Date | string>;
  updated_at: ColumnType<Date, Date | string, Date | string>;
}

export type SelectBitrixTenant = Selectable<BitrixTenant>;
export type InsertBitrixTenant = Insertable<BitrixTenant>;
export type UpdateBitrixTenant = Updateable<BitrixTenant>;
