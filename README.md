# Bitrix24 Application Starter Kit

Bitrix24 app skeleton using a simplified OAuth 2.0 installation flow.
Registers two default widgets: a CRM deal tab and a custom CRM field widget.

## What You Get

- **NestJS backend** with contract-based routing and validation
- **React 19 frontend** with Bitrix24 JS SDK and `@common/b24ui-react`
- **Shared API contracts** (Zod schemas, type-safe routes) in `packages/contracts/`
- **PostgreSQL 17** with Kysely query builder and migrations
- **RabbitMQ** for async workloads
- **MinIO** S3-compatible object storage
- **Biome** for linting and formatting
- **Modular instructions** for AI agents in `instructions/`

## Repository Layout

```
├── apps/
│   ├── back-end/              # NestJS API (port 8000)
│   └── front-end/             # React 19 + Vite SPA
│       ├── src/                # pages, components, hooks, atoms
│       └── vite.config.ts
├── packages/
│   ├── contracts/             # @common/contracts — Zod schemas, routes, types
│   └── b24ui-react/           # @common/b24ui-react — B24 React hooks, atoms, provider
├── instructions/              # AI agent knowledge base
│   ├── knowledge.md           # start here
│   ├── node/                  # NestJS backend guides
│   ├── front/                 # React/Vite guides
│   ├── bitrix24/              # platform specifics
│   └── queues/                # RabbitMQ recipes
├── docker-compose.yml         # Dev services: PostgreSQL, RabbitMQ, MinIO
├── pnpm-workspace.yaml
└── biome.json
```

## Tech Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| **Backend**    | NestJS 11, TypeScript, Kysely, `contracts-nestjs`       |
| **Frontend**   | React 19, Vite 8, Tailwind CSS 4, Jotai, `@common/b24ui-react` |
| **Contracts**  | `@common/contracts` — Zod schemas shared across apps    |
| **Database**   | PostgreSQL 17 (Alpine), Kysely query builder            |
| **Queue**      | RabbitMQ 3.13                                           |
| **Storage**    | MinIO (S3-compatible)                                   |
| **Monorepo**   | pnpm workspaces                                         |
| **Linter**     | Biome                                                   |

## Development Services (docker-compose.yml)

`docker compose up` starts three infrastructure services:

| Service    | Ports        | Purpose                            |
|------------|--------------|-------------------------------------|
| PostgreSQL | 5432         | Database (schema managed by Kysely) |
| RabbitMQ   | 5672, 15672  | Message queue + management UI       |
| MinIO      | 9000, 9001   | S3-compatible storage + console     |

The NestJS and React apps run on the host, not in containers.

## Quick Start

1. Copy `.env.example` to `.env` and fill in credentials.
2. `docker compose up` — start PostgreSQL, RabbitMQ, MinIO.
3. `pnpm --filter back-end run start:dev` — start the NestJS API.
4. `pnpm --filter front-end run dev` — start the Vite dev server.
5. Register the app in your Bitrix24 portal:
   - **Main URL:** your public tunnel domain
   - **Install URL:** `[domain]/install`
   - **Scopes:** `crm`, `user_brief`, `pull`, `placement`, `userfieldconfig`
6. Put `CLIENT_ID` and `CLIENT_SECRET` from the portal into `.env`, then restart the backend.
7. Reinstall the app inside your portal to refresh tokens.

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

All API contracts live in `packages/contracts/`. The single contract object is exported as `$` from `packages/contracts/src/index.ts` and used for `@BindContract` binding and type extraction.

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

### Backend usage

`@BindContract` from `contracts-nestjs` replaces `@Get()`/`@Post()` decorators and auto-wires routing, validation, and response formatting:

```ts
import { BindContract } from "contracts-nestjs";
import { $ } from "@common/contracts";

@Controller()
export class MyFeatureController {
  @BindContract($, "getItems")
  async getItems(@Query() query: $.Query<"getItems">) {
    return items; // automatically wrapped as { success: true, data }
  }
}
```

## Authentication & Security

### JWT tokens

Every endpoint except `/api/install` and `/api/getToken` requires:

```
Authorization: Bearer <token>
```

### Authentication flow

1. **App installation** (`/api/install`) — receives Bitrix24 auth data, stores installation info. No JWT required.
2. **Issue token** (`/api/getToken`) — accepts Bitrix24 auth payload, returns a JWT (TTL = 1 hour). No JWT required.
3. **Protected endpoints** — validate JWT via NestJS guards, extract `bitrix24_account`, call Bitrix24 API via SDK.

## Frontend

### Key directories

- `apps/front-end/src/pages/` — page components (`.tsx` files)
- `apps/front-end/src/main.tsx` — app entry point with `B24Provider` and React Router
- `apps/front-end/vite.config.ts` — Vite config with Tailwind CSS and API proxy

### Conventions

- Wrap the app in `<B24Provider>` (from `@common/b24ui-react`) for B24 frame init, JWT, and Jotai atoms
- Routing via React Router (`react-router`)
- Hooks from `@common/b24ui-react`: `useB24Init`, `useApiClient`, `useB24Frame`
- State management via Jotai atoms (exported from `@common/b24ui-react`)
- Tailwind CSS 4 via `@tailwindcss/vite` plugin

## Widgets, Events, Robots

If your feature involves widgets, events, or robots, review these docs first:

- **Widgets:** [API reference](https://github.com/bitrix-tools/b24-rest-docs/tree/main/api-reference/widgets) | [Widget guide](./instructions/bitrix24/widget.md)
- **Events:** [API reference](https://github.com/bitrix-tools/b24-rest-docs/tree/main/api-reference/events) — register via `event.bind` during installation
- **Robots:** [CRM robot guide](./instructions/bitrix24/crm-robot.md) — register via `bizproc.robot.add`

## Queues & RabbitMQ

- Broker: AMQP `5672`, management UI `15672`
- Guide: `instructions/queues/node.md`

## Instructions System (for AI agents)

Entry point: `instructions/knowledge.md`

```
instructions/
├── knowledge.md              # central hub — start here
├── node/knowledge.md         # NestJS backend patterns
├── node/code-review.md       # backend code review standards
├── front/knowledge.md        # frontend (React/Vite) guide
├── bitrix24/crm-robot.md     # CRM robot instructions
├── bitrix24/widget.md        # widget instructions
├── queues/server.md          # queue server setup
├── queues/node.md            # Node.js + amqplib recipes
└── queues/prompt.md          # AI prompt for queue tasks
```

**Reading workflow:** `knowledge.md` -> `node/knowledge.md` or `front/knowledge.md` -> specialized docs as needed.

## Resources

- REST API docs: https://apidocs.bitrix24.com
- JS SDK: https://github.com/bitrix24/b24jssdk

## License

Licensed under MIT. See [LICENSE](./LICENSE) for details.
