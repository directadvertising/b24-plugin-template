# Feature-first structure (back-end)

The back-end is organised **feature-first**: code is grouped by the capability it
serves, not by technical type. A feature owns its router and business logic in one
folder. Only genuinely shared, feature-agnostic code (the DB handle, middleware,
table types) lives at the top level.

## `src/` layout

```
apps/back-end/src/
├── main.ts                 # express init: mounts every feature router
├── env.ts                  # env loading/validation
├── lib/                    # shared utilities NOT tied to a feature (db.ts, …)
├── middleware/             # shared Express middleware (auth.ts, contract.ts)
├── entities/
│   ├── index.ts            # export interface Database { … } — the Kysely schema source of truth
│   └── <name>.entity.ts    # one file per table: interface + Select/Insert/Update types
└── features/
    └── <name>/             # one folder per feature
        ├── lib/                # feature-local helpers (not shared)
        ├── <name>.service.ts   # business logic — DB + portal calls
        └── <name>.router.ts    # Express router, contract-bound, mounted in main.ts
```

## File naming

Within a feature, files are named after the feature with a role suffix:

| File                       | Holds                                                            |
| -------------------------- | --------------------------------------------------------------- |
| `<name>.router.ts`         | The Express `Router` — binds contract routes to handlers.       |
| `<name>.service.ts`        | Business logic: DB queries (Kysely) and portal calls (`b24Call`). |
| `<name>.<concern>.service.ts` | A second/third service when one file gets too broad (e.g. `deals.export.service.ts`). |
| `lib/`                     | Feature-local helpers used only inside this feature.            |

Keep one feature's code inside its folder. The **router** is the only thing the
rest of the app reaches — services are an implementation detail of the feature.

### `<name>.router.ts`

The router binds contract routes (`contractMiddleware` validates params/query/body
and wraps the response as `{ success, data }`), applies `authMiddleware`, and
delegates all real work to the service. Handlers stay thin.

```ts
// features/items/items.router.ts
import { $ } from "@common/contracts";
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { contractMiddleware } from "../../middleware/contract";
import { getItem } from "./items.service";

export const itemsRouter = Router();

itemsRouter.get(
  $.routes.getItem.pathTemplate,
  contractMiddleware($.routes.getItem),
  authMiddleware,
  async (req, res) => {
    const item = await getItem(req.user.memberId, req.params.id);
    res.json(item);
  },
);
```

### `<name>.service.ts`

Pure-ish functions that do the work: DB access via the shared `db` handle, portal
calls via `b24Call`. No Express `req`/`res` here — services take plain arguments
(always including the tenant's `memberId`) and return typed data.

```ts
// features/items/items.service.ts
import { db } from "../../lib/db";

export async function getItem(memberId: string, id: string) {
  return db
    .selectFrom("items")
    .selectAll()
    .where("member_id", "=", memberId) // every tenant-scoped query filters by memberId
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
}
```

Split into `<name>.<concern>.service.ts` files when a single service grows several
unrelated responsibilities; the router imports from whichever it needs.

## Mounting routers

`main.ts` collects feature routers and mounts them. Re-export each feature's router
through `features/index.ts` so `main.ts` stays a single loop:

```ts
// features/index.ts
export { itemsRouter } from "./items/items.router";
export { healthRouter } from "./health/health.router";
```

```ts
// main.ts
import * as routers from "./features";

for (const [name, router] of Object.entries(routers)) {
  app.use(router);
  console.info(`Loaded '${name}' router`);
}
```

## `entities/` — the schema source of truth

Kysely has no codegen here, so the TypeScript schema is maintained by hand and
**must mirror the dbmate SQL migrations**. Each table gets a file; `index.ts`
assembles them into the `Database` interface Kysely is typed with.

```ts
// entities/bitrix-user.entity.ts
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export interface BitrixUser {
  id: Generated<string>;
  member_id: string;
  domain: string;
  // … mirror the migration columns exactly (names, nullability, types)
}

export type SelectBitrixUser = Selectable<BitrixUser>;
export type InsertBitrixUser = Insertable<BitrixUser>;
export type UpdateBitrixUser = Updateable<BitrixUser>;
```

```ts
// entities/index.ts
import type { BitrixUser } from "./bitrix-user.entity";
import type { BitrixTenant } from "./bitrix-tenant.entity";

export interface Database {
  bitrix_user: BitrixUser;
  bitrix_tenant: BitrixTenant;
}
```

`lib/db.ts` imports `Database` and exports the `db = new Kysely<Database>(…)` handle
that services use. See [`../../.claude/rules/migrations.md`](../../.claude/rules/migrations.md)
for the migrate → mirror discipline.

## Where does code go?

- **Used by one feature** → inside that feature (`features/<name>/…`).
- **Shared, feature-agnostic** → top-level `lib/` (the `db` handle, helpers) or
  `middleware/`.
- **A table type** → `entities/<name>.entity.ts`, added to the `Database` interface.
- **A new capability** → a new `features/<name>/` folder with its `.router.ts`
  (and `.service.ts`), re-exported from `features/index.ts`.

Promote code out of a feature only when a second feature genuinely needs it.

See also [`calling-apis.md`](./calling-apis.md) for server-side portal calls
(`b24Call`, OAuth refresh) and the [backend rule](../../.claude/rules/backend.md)
for auth, tokens, and multi-tenancy.
