import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

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
