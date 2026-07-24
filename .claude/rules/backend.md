---
paths:
  - "apps/back-end/src/**/*.ts"
---

# Backend Rules (`apps/back-end/`)

Express 5 + Kysely (`pg` driver).

## Feature-first structure

Code is grouped by feature, not by type. A feature owns its router and logic:

```
src/
├── lib/                # shared, feature-agnostic utilities (db.ts, …)
├── middleware/         # shared Express middleware (auth.ts, contract.ts)
├── entities/
│   ├── index.ts        # export interface Database { … } — Kysely schema source of truth
│   └── <name>.entity.ts # per-table interface + Select/Insert/Update types
└── features/<name>/
    ├── lib/                # feature-local helpers
    ├── <name>.service.ts   # business logic — DB + portal calls (split into <name>.<concern>.service.ts as needed)
    └── <name>.router.ts    # Express router, contract-bound; re-exported from features/index.ts, mounted in main.ts
```

- Routers stay thin (validate + delegate); all real work lives in services. Services take plain args (always `memberId`) — never `req`/`res`.
- `entities/index.ts` is the hand-maintained `Database` interface; `lib/db.ts` exports the `db` handle typed with it.
- Promote code to top-level `lib/`/`middleware/` only when a second feature needs it.

Full how-to: [`docs/back-end/feature-structure.md`](../../docs/back-end/feature-structure.md).

## Going deeper

This rule is the always-loaded quick reference. When you're actually building or
debugging a Bitrix24 feature, **invoke the `bitrix` skill** for the full patterns
— it maps to the docs below.

## Docs — read the right one first

- [`docs/back-end/feature-structure.md`](../../docs/back-end/feature-structure.md) — read when adding a feature, router, service, or table type: the `features/<name>/` layout, file naming (`<name>.router.ts` / `<name>.service.ts`), and `entities/`.
- [`docs/back-end/calling-apis.md`](../../docs/back-end/calling-apis.md) — read before calling the Bitrix24 REST API server-side: `b24Call`, credential resolvers (`getPortalCreds` / `getB24CredsById`), and token refresh. Always route portal `/rest/` calls through `services/b24-client.ts`.
- Frontend-side calls (JS SDK frame, the `@common/bitrix` API client) live in [`docs/front-end/`](../../docs/front-end/) — covered by the frontend rule.

## Auth & security

Portal identity (`member_id`) comes from Bitrix24's **central OAuth server** (`app.info` at `oauth.bitrix.info/rest/`) — a fake portal could otherwise self-certify. User identity (`user.current`, `user.admin`) is **portal-scoped** and must be fetched from the **portal instance**; the central server does not serve those methods. The instance is addressed by the domain **stored** for that `member_id`, falling back to the client-supplied `DOMAIN` only on first install.

Flow: frontend sends B24 OAuth creds → `POST /install` (first time) or `POST /getToken` → backend resolves `MEMBER_ID` centrally, then verifies the user against the portal → cross-checks central `MEMBER_ID` vs client `member_id` (`B24_MEMBER_MISMATCH`) and stored `domain` vs client domain (`B24_DOMAIN_MISMATCH`) → issues 1-hour JWT `{ bitrix24AccountId, userId, memberId, isAdmin }`.

Key files: `services/b24-auth.ts` (`verifyB24Token`), `routes/auth.ts`, `routes/install.ts`, `middleware/auth.ts`, `types/express.d.ts`.

## Tokens (two kinds — never conflate)

- **B24 OAuth** (`access_token` / `refresh_token`, stored per account in `bitrix_user`) — calls the **portal** REST API. Refresh tokens are **single-use**. Always call the portal via `b24Call` (`services/b24-client.ts`); it refreshes-and-retries on 401 through `refreshAccessToken` (`services/b24-oauth.ts`): with `CLIENT_ID`+`CLIENT_SECRET` → locked OAuth refresh against `oauth.bitrix.info`; without them → plain DB re-read of a fresher token the frontend wrote via `getToken` (no OAuth call, no lock).
- **Our JWT** (1-hour, `{ bitrix24AccountId, userId, memberId, isAdmin }`) — the **session** token. Issued by `/install` & `/getToken`, validated by `authMiddleware`, sent by the frontend on every call to **our** API. Not a B24 token.

## Multi-tenancy

Multi-tenant by portal (`member_id`). **Every tenant-scoped query must filter by `req.user.memberId`.** Use `req.user.isAdmin` to gate admin ops. Never trust client-supplied `member_id` — always use the JWT value.

## Database / migrations

`lib/db.ts` exports a typed `Kysely<Database>` for queries only — it does **not** run migrations. The `Database` interface lives in `entities/index.ts` (one file per table under `entities/`), the hand-maintained TypeScript mirror of the schema — there's no codegen. Schema is owned by **dbmate** (raw SQL in the root `migrations/` dir) and applied by the one-shot `dbmate` Docker service, which the `back-end` service `depends_on` (`service_completed_successfully`). So `docker compose up` migrates before the API starts; the API never migrates itself.

To add a migration: scaffold with `docker compose run --rm dbmate new <name>`, write the `-- migrate:up`/`-- migrate:down` SQL, then mirror the change by hand in `entities/`. See [`migrations.md`](./migrations.md) for the full authoring + apply workflow.

## Routes

Bind contract routes with `contractMiddleware` (validates params/query/body, auto-wraps response as `{ success, data }`):

```ts
router.get(
  BitrixContract.routes.getItem.pathTemplate,
  contractMiddleware(BitrixContract.routes.getItem),
  authMiddleware,
  async (req, res) => res.json({ id: req.params.id, title: "Example" }),
);
```

Put each feature's router in `features/<name>/<name>.router.ts`, re-export it from `features/index.ts` (auto-loaded in `main.ts`), and keep handlers thin — delegate to `<name>.service.ts`. Always scope queries by `memberId`.
