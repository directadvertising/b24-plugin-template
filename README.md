# Bitrix24 Application Starter Kit

Bitrix24 app skeleton using a simplified OAuth 2.0 installation flow.
Registers two default widgets: a CRM deal tab and a custom CRM field widget.

## What You Get

- **Express 5 backend** with contract-based routing and validation
- **React 19 frontend** with Bitrix24 JS SDK and `@common/bitrix`
- **Shared API contracts** (Zod schemas, type-safe routes) in `packages/contracts/`
- **PostgreSQL 17** with Kysely query builder and dbmate SQL migrations
- **RabbitMQ** for async workloads
- **MinIO** S3-compatible object storage
- **AI agent docs** in `docs/`, with path-scoped rules in `.claude/rules/`

## Repository Layout

```
├── apps/
│   ├── back-end/              # Express 5 API (port 3000)
│   └── front-end/             # React 19 + Vite SPA
│       ├── src/features/       # feature-first: pages, components, lib, hooks
│       └── vite.config.ts
├── packages/
│   ├── contracts/             # @common/contracts — Zod schemas, routes, types
│   └── bitrix/                    # @common/bitrix — B24 React hooks, atoms, provider
├── migrations/                # dbmate SQL migrations (applied by the dbmate service)
├── docs/                      # AI agent docs (back-end/, front-end/, bitrix24/)
├── .claude/rules/             # path-scoped rules auto-loaded by area
├── docker-compose.yml         # Dev services: PostgreSQL, RabbitMQ, MinIO, dbmate
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| **Backend**    | Express 5, TypeScript, Kysely, `contractMiddleware`     |
| **Frontend**   | React 19, Vite 8, Tailwind CSS 4, Jotai, `@common/bitrix` |
| **Contracts**  | `@common/contracts` — Zod schemas shared across apps    |
| **Database**   | PostgreSQL 17 (Alpine), Kysely query builder, dbmate migrations |
| **Queue**      | RabbitMQ 3.13                                           |
| **Storage**    | MinIO (S3-compatible)                                   |
| **Monorepo**   | pnpm workspaces                                         |

## Development Services (docker-compose.yml)

`docker compose up` starts all services. Routing goes through **Forge** (Traefik reverse proxy):

| Service    | Internal Port | Forge Route                        | Purpose                                        |
| ---------- | ------------- | ---------------------------------- | ---------------------------------------------- |
| front-end  | 5173          | `b24-template.local/`              | Vite dev server                                |
| back-end   | 3000          | `b24-template.local/api`           | Express API server                             |
| minio      | 9000          | `b24-template.local/files`         | S3-compatible storage                          |
| PostgreSQL | 5432          | (internal only)                    | Database (schema managed by dbmate migrations) |
| dbmate     | —             | (internal, one-shot)               | Applies `migrations/` on startup, then exits   |
| RabbitMQ   | 5672          | (internal only)                    | Message queue                                  |

## Database Migrations

Schema is managed by [**dbmate**](https://github.com/amacneil/dbmate) — plain SQL files in `migrations/`. On `docker compose up`, the one-shot `dbmate` service runs `dbmate up` (after Postgres is healthy) and the `back-end` waits for it to finish, so the API always starts against an up-to-date schema.

```bash
docker compose run --rm dbmate new add_widgets   # scaffold migrations/<ts>_add_widgets.sql
docker compose run --rm dbmate up                # apply pending migrations
docker compose run --rm dbmate status            # list applied / pending
docker compose run --rm dbmate down              # roll back the most recent migration
```

Each file has `-- migrate:up` and `-- migrate:down` sections (raw SQL). After changing the schema, mirror it by hand in the `Database` interface in `apps/back-end/src/db.ts` — that interface is the type source of truth for Kysely (no codegen). Applied versions are tracked in the `schema_migrations` table.

## Quick Start

1. Copy `.env.example` to `.env` and fill in credentials.
2. `docker compose up` — start all services.
3. Register the app in your Bitrix24 portal:
   - **Main URL:** your public tunnel domain
   - **Install URL:** `[domain]/install`
   - **Scopes:** `crm`, `user_brief`, `pull`, `placement`, `userfieldconfig`
4. Put `CLIENT_ID` and `CLIENT_SECRET` from the portal into `.env`, then restart the backend.
5. Reinstall the app inside your portal to refresh tokens.

## Environment

Configuration lives in `.env` (not committed). Key variables:

| Variable                    | Purpose                                  |
|-----------------------------|------------------------------------------|
| `CLIENT_ID`                 | Bitrix24 app client ID                   |
| `CLIENT_SECRET`             | Bitrix24 app client secret               |
| `JWT_SECRET`                | JWT signing key                          |
| `DB_HOST`, `DB_PORT`        | PostgreSQL host and port                 |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL credentials            |
| `RABBITMQ_USER`, `RABBITMQ_PASSWORD` | RabbitMQ credentials             |
| `S3_ENDPOINT`, `S3_PORT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | MinIO/S3 |
| `NODE_ENV`                  | `development` or `production`            |

## Contracts (`packages/contracts/`)

All API contracts live in `packages/contracts/`. The single contract object is exported as `$` from `packages/contracts/src/index.ts` and used for type extraction throughout the project.

```ts
import { createContract } from "contracts";
import { z } from "zod";

export const $ = createContract({
  routes: {
    getItem: {
      method: "GET",
      name: "Get Item",
      description: "Fetches a single item by ID",
      path: "/items/:id",
      params: z.object({ id: z.string() }),
      query: null,
      body: null,
      data: z.object({ id: z.string(), title: z.string() }),
      errorCodes: [],
    },
  },
});
```

Type inference via the `$` namespace: `$.Body<"routeName">`, `$.Query<"routeName">`, `$.Params<"routeName">`, `$.Data<"routeName">`.

All responses follow `{ success: true, data: T }` on success and `{ success: false, error: { code, message } }` on failure.

### Backend usage (`contractMiddleware`)

Use `contractMiddleware` from `middleware/contract.ts` to bind contract routes in Express:

```ts
import { Router } from "express";
import { contractMiddleware } from "../middleware/contract";
import { $ } from "@common/contracts";

const router = Router();

router.get(
  $.routes.getItem.pathTemplate,
  contractMiddleware($.routes.getItem),
  authMiddleware,
  async (req, res) => {
    // req.params, req.query, req.body are validated
    // res.json(data) auto-wraps as { success: true, data }
    res.json({ id: req.params.id, title: "Example" });
  },
);
```

## Authentication & Security

Every endpoint except `/api/install` and `/api/getToken` requires a JWT:

```
Authorization: Bearer <token>
```

### Authentication flow

1. **Installation** (`POST /api/install`) — frontend sends Bitrix24 OAuth credentials (`AUTH_ID`, `member_id`, `DOMAIN`). Backend verifies the token against Bitrix24's central OAuth server (`oauth.bitrix.info`), cross-checks `member_id`, and creates account + installation records.
2. **Token issuance** (`POST /api/getToken`) — called on every app open. Backend re-verifies the token with `oauth.bitrix.info`, confirms the portal is installed, checks domain consistency against stored records, and issues a 1-hour JWT.
3. **Protected endpoints** — JWT validated by auth middleware. `req.user` contains `{ bitrix24AccountId, userId, memberId, isAdmin }`.

### Trust model

Tokens are verified against `oauth.bitrix.info/rest/` (hardcoded) — **never** the client-supplied domain. Three parallel calls validate the token:

- `user.current` — confirms token is real, returns user ID
- `user.admin` — checks portal admin status
- `app.info` — returns `MEMBER_ID` from a trusted source

Additional cross-checks:
- Central-server `MEMBER_ID` must match client-supplied `member_id`
- Stored `domain_url` must match client-supplied domain (on `getToken`)

### Multi-tenancy

The app is multi-tenant by Bitrix24 portal. Each portal is identified by `member_id` (carried in the JWT as `memberId`). All database queries for tenant-scoped data **must** filter by `memberId` to prevent cross-portal data leaks.

## Frontend

### Key directories

The front-end is organised **feature-first** — code is grouped by feature under
`features/<name>/`. See [`docs/front-end/feature-structure.md`](docs/front-end/feature-structure.md).

- `apps/front-end/src/features/<name>/` — per-feature `pages/`, `components/`, `lib/`, `hooks/`, `query-keys.ts`, `index.ts`
- `apps/front-end/src/components/ui/` — shared shadcn/ui primitives; `src/lib/` — shared utilities (`query-client.ts`)
- `apps/front-end/src/router.tsx` — wouter routes; `src/main.tsx` / `src/app.tsx` — entry + providers
- `apps/front-end/vite.config.ts` — Vite config with Tailwind CSS and API proxy

### Conventions

- Wrap the app in `<B24Provider>` (from `@common/bitrix`) and `<QueryClientProvider>` for B24 frame init, JWT, Jotai atoms, and TanStack Query
- Routing via `wouter`; pages live in feature folders and mount in `router.tsx`
- Hooks from `@common/bitrix`: `useB24Init`, `useApiClient`, `useB24Frame`
- Server state via TanStack Query (feature `hooks/` + `query-keys.ts`); shared client state via Jotai atoms
- Tailwind CSS 4 via `@tailwindcss/vite` plugin

## Widgets, Events, Robots

If your feature involves widgets, events, or robots, review these docs first:

- **Widgets:** [API reference](https://github.com/bitrix-tools/b24-rest-docs/tree/main/api-reference/widgets) | [Widget guide](./docs/bitrix24/widget.md)
- **Events:** [API reference](https://github.com/bitrix-tools/b24-rest-docs/tree/main/api-reference/events) — register via `event.bind` during installation
- **Robots:** [CRM robot guide](./docs/bitrix24/crm-robot.md) — register via `bizproc.robot.add`

## Queues & RabbitMQ

- Broker: AMQP `5672`, management UI `15672`
- Guide: [`docs/back-end/queues.md`](./docs/back-end/queues.md)

## AI agent docs

Two layers, both checked into the repo:

- **`.claude/rules/`** — short, path-scoped rules auto-loaded when you touch matching files (`backend.md`, `frontend.md`, `routing.md`, `contracts.md`, `migrations.md`).
- **`docs/`** — deeper how-tos the rules link into:

```
docs/
├── back-end/      # calling-apis, queues
├── front-end/     # feature-structure, bitrix-package, calling-apis, installation
└── bitrix24/      # crm-robot, widget
```

For Bitrix24 specifics, the `bitrix` skill (`.claude/skills/bitrix/`) is the deep reference.

**Reading workflow:** `knowledge.md` -> `node/knowledge.md` or `front/knowledge.md` -> specialized docs as needed.

## Resources

- REST API docs: https://apidocs.bitrix24.com
- JS SDK: https://github.com/bitrix24/b24jssdk

## License

Licensed under MIT. See [LICENSE](./LICENSE) for details.
