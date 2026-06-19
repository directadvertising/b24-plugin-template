import type { BitrixTenant } from "./bitrix-tenant.entity";
import type { BitrixUser } from "./bitrix-user.entity";

export * from "./bitrix-tenant.entity";
export * from "./bitrix-user.entity";

// Hand-maintained TypeScript mirror of the dbmate schema (no codegen).
// Every table change in `migrations/` must be reflected here.
export interface Database {
  bitrix_user: BitrixUser;
  bitrix_tenant: BitrixTenant;
}
