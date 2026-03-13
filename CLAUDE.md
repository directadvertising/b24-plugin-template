# Bitrix24 Application Starter Kit

Bitrix24 app skeleton using a simplified OAuth 2.0 installation flow.
Registers two default widgets: a CRM deal tab and a custom CRM field widget.

## Project Structure

```
├── apps/
│   ├── back-end/         # Express 5 API (port 3000)
│   └── front-end/        # React 19 + Vite SPA
│       ├── src/           # pages, components, hooks, atoms
│       └── vite.config.ts
├── packages/
│   ├── contracts/        # @common/contracts — API contracts (Zod schemas, routes, types)
│   └── b24ui-react/      # @common/b24ui-react — B24 React hooks, atoms, provider
├── instructions/         # AI agent knowledge base (see below)
└── docker-compose.yml    # Dev services: apps + PostgreSQL, RabbitMQ, MinIO
```

## Commits

- When commiting **always** follow commitlint conventional config
- **NEVER** add Claude signatures to commits

## Dev Servers

- **NEVER** run dev servers directly (e.g. `pnpm dev`, `pnpm start:dev`, `vite`) — use `docker compose` exclusively for the development server
- To check server output, use `docker compose logs back-end` or `docker compose logs front-end`

## Tech Stack

- **Backend:** Express 5, Kysely — `apps/back-end/`
- **Frontend:** React 19, Vite, Tailwind CSS 4, shadcn/ui, Jotai, `@common/b24ui-react` — `apps/front-end/`
- **Database:** PostgreSQL 17 (Alpine), Kysely query builder
- **Queue:** RabbitMQ 3.13
- **Object Storage:** MinIO (S3-compatible)

## Development Services (docker-compose.yml)

`docker compose up` starts all services. Routing goes through **Forge** (Traefik reverse proxy):

| Service    | Internal Port | Forge Route                        | Purpose                                        |
| ---------- | ------------- | ---------------------------------- | ---------------------------------------------- |
| front-end  | 5173          | `b24-template.local/`              | Vite dev server                                |
| back-end   | 3000          | `b24-template.local/api`           | Express API server                             |
| minio      | 9000          | `b24-template.local/files`         | S3-compatible storage                          |
| PostgreSQL | 5432          | (internal only)                    | Database (schema managed by Kysely migrations) |
| RabbitMQ   | 5672          | (internal only)                    | Message queue                                  |

## Environment

Configuration lives in `.env` (copy from `.env.example`). Key variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL
- `RABBITMQ_USER`, `RABBITMQ_PASSWORD` — RabbitMQ
- `S3_ENDPOINT`, `S3_PORT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` — MinIO/S3
- `JWT_SECRET` — JWT signing key
- `CLIENT_ID`, `CLIENT_SECRET` — Bitrix24 OAuth
- `NODE_ENV` — `development` or `production`
- `API_URL` — Backend URL for front-end proxy (default: `http://back-end:3000`)

## Database (Kysely)

Database access uses Kysely with the `pg` driver.

The `db.ts` file exports a typed `Kysely<Database>` instance and `runMigrations()`.

```ts
import { db } from "./db";
// Types: Bitrix24Account, ApplicationInstallation
// Helpers: SelectBitrix24Account, InsertBitrix24Account, etc.
```

## Backend Architecture (`apps/back-end/`)

### Middleware

- **`auth.ts`** — JWT Bearer token validation, attaches `req.user`
- **`contract.ts`** — `contractMiddleware({ params, query, body, response: { data } })` for Zod validation + response envelope. `ContractError` for typed error responses. `contractErrorHandler` as Express error handler.

### Routes

```
POST /getToken     — JWT token issuance
POST /install      — B24 OAuth installation
GET  /health       — Health check (auth required)
```

### Adding New Routes

1. Create a new router file in `src/routes/`:
```ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";

export const myRouter = Router();

myRouter.get("/my-endpoint", authMiddleware, (req, res) => {
  res.json({ hello: "world" });
});
```

2. Export from `src/routes/index.ts`:
```ts
export { myRouter } from "./my-route";
```

The router is auto-loaded in `main.ts`.

## Instructions System (for AI agents)

Entry point: `instructions/knowledge.md`

```
instructions/
├── knowledge.md              # central hub — start here
├── node/knowledge.md         # Node.js backend patterns
├── node/code-review.md       # Node.js code review standards
├── front/knowledge.md        # frontend (React/Vite) guide
├── bitrix24/crm-robot.md     # CRM robot instructions
├── bitrix24/widget.md        # widget instructions
├── queues/server.md          # queue server setup
├── queues/node.md            # Node.js + amqplib recipes
└── queues/prompt.md          # AI prompt for queue tasks
```

**Reading workflow:** knowledge.md → stack-specific knowledge → specialized docs only as needed.

## Bitrix24 Platform Essentials

- **REST API** — single entry point to portal data; OAuth 2.0 auth; batch requests
- **JS SDK** — `@bitrix24/b24jssdk` for client-side API calls and UI management
- **UI Kit** — `@common/b24ui-react`; provides `B24Provider`, hooks, and Jotai atoms
- **Core CRM entities:** Leads, Deals, Contacts, Companies, Activities

## Frontend Conventions

- Wrap the app in `<B24Provider>` (from `@common/b24ui-react`) for B24 frame init, JWT, and Jotai atoms
- Routing via React Router (`react-router`) — pages are `.tsx` components in `src/pages/`
- Hooks from `@common/b24ui-react`: `useB24Init`, `useApiClient`, `useB24Frame`, `useB24FrameOrNull`
- State management via Jotai atoms (exported from `@common/b24ui-react`)
- UI components via shadcn/ui — add new components with `pnpm --filter front-end exec shadcn add <component>`
- Tailwind CSS 4 via `@tailwindcss/vite` plugin
- `@` path alias resolves to `src/` (configured in tsconfig.app.json and vite.config.ts)

## Contracts (`packages/contracts/`)

All API contracts live in `packages/contracts/` (package `@common/contracts`). The single contract object is exported as **`$`** from `packages/contracts/src/index.ts`. All routes are defined on `$`, and `$` is used for type extraction throughout the project.

Use `createContract` from the `contracts` dependency to define routes on `$`:

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

**Route properties:**

| Property      | Type               | Required             | Purpose                             |
| ------------- | ------------------ | -------------------- | ----------------------------------- |
| `method`      | HTTP verb          | yes                  | GET, POST, PUT, PATCH, DELETE       |
| `name`        | string             | yes                  | Human-readable identifier           |
| `description` | string             | yes                  | Detailed explanation                |
| `path`        | string             | yes                  | URL pattern (`:param` placeholders) |
| `params`      | Zod object \| null | if path has `:param` | URL parameter validation            |
| `query`       | Zod schema \| null | yes                  | Query string validation             |
| `body`        | Zod schema \| null | yes                  | Request payload validation          |
| `data`        | Zod schema \| null | yes                  | Success response schema             |
| `errorCodes`  | string[]           | yes                  | Custom error identifiers            |

**Path handling:** After creation, `path` becomes a callable function — `path()` for static paths, `path({ id: "123" })` for parameterized ones. Original template available via `pathTemplate`.

**Type inference — use the `$` namespace:**

- `$.Route` — union of all route names
- `$.Body<"routeName">` — request body type
- `$.Query<"routeName">` — query params type
- `$.Params<"routeName">` — URL params type
- `$.Data<"routeName">` — response data type

**Response envelope:** All responses follow `{ success: true, data: T }` on success and `{ success: false, error: { code, message } }` on failure. The server validates return values against the `data` schema (500 on mismatch).

## Backend Contract Usage (`contractMiddleware`)

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

## Development Workflow

1. Copy `.env.example` to `.env` and fill in credentials
2. `docker compose up` — start all services
3. Register the app in your Bitrix24 portal with the public URL

## Resources

- REST API docs: https://apidocs.bitrix24.com
- JS SDK: https://github.com/bitrix24/b24jssdk
