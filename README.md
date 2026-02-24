# Bitrix24 Application Starter Kit

Bitrix24 app skeleton using a simplified OAuth 2.0 installation flow.
Registers two default widgets: a CRM deal tab and a custom CRM field widget.

## What You Get

- **NestJS backend** with contract-based routing and validation
- **Nuxt 4 frontend** with Bitrix24 UI Kit and JS SDK
- **Shared API contracts** (Zod schemas, type-safe routes) in `packages/contracts/`
- **PostgreSQL 17** database
- **RabbitMQ** for async workloads (optional)
- **Docker Compose** with profile-based service selection
- **Ngrok** tunnel for local Bitrix24 development
- **Makefile** with day-to-day commands
- **Modular instructions** for AI agents in `instructions/`
- **Biome** for linting and formatting

## Repository Layout

```
├── apps/
│   ├── back-end/              # NestJS API (port 8000)
│   └── front-end/             # Nuxt 4 + Vue 3 + Bitrix24 UI Kit
│       ├── app/               # pages, components, composables, stores
│       ├── i18n/              # localization (18+ languages)
│       └── nuxt.config.ts
├── packages/
│   └── contracts/             # @common/contracts — Zod schemas, routes, types
├── infrastructure/
│   └── database/init.sql
├── instructions/              # AI agent knowledge base
│   ├── knowledge.md           # start here
│   ├── node/                  # NestJS backend guides
│   ├── front/                 # Nuxt/B24UI guides
│   ├── bitrix24/              # platform specifics
│   └── queues/                # RabbitMQ recipes
├── docker-compose.yml
├── makefile
├── pnpm-workspace.yaml
└── biome.json
```

## Tech Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| **Backend**    | NestJS 11, TypeScript, `contracts-nestjs`               |
| **Frontend**   | Nuxt 4, Vue 3, Tailwind CSS 4, Pinia, `@bitrix24/b24ui-nuxt` |
| **Contracts**  | `@common/contracts` — Zod schemas shared across apps    |
| **Database**   | PostgreSQL 17 (Alpine)                                  |
| **Queue**      | RabbitMQ 3.13 (optional, `ENABLE_RABBITMQ=1`)          |
| **Tunnel**     | ngrok                                                   |
| **Monorepo**   | pnpm workspaces                                         |
| **Linter**     | Biome                                                   |

## Docker Compose Profiles

| Profile    | What it starts                |
|------------|-------------------------------|
| `frontend` | Nuxt dev server (port 3000)   |
| `node`     | NestJS API (port 8000)        |
| `ngrok`    | ngrok tunnel to frontend      |
| `queue`    | RabbitMQ (ports 5672, 15672)  |

The database service runs without a profile (always on).

## Make Commands

```sh
make help              # list all commands

# Development
make dev-init          # interactive project setup (start here)
make dev-node          # start frontend + NestJS backend + ngrok
make dev-front         # start frontend only

# Production
make prod-node         # NestJS production build

# Monitoring
make status            # docker stats
make ps                # watch docker ps
make logs              # tail all container logs

# Queues
make queue-up          # start RabbitMQ only
make queue-down        # stop RabbitMQ only

# Cleanup
make down              # stop all containers
make clean             # full Docker cleanup (containers, networks, volumes)

# Security
make security-scan     # dependency vulnerability audit
make security-tests    # orchestrated security test suite
```

## Quick Start

1. Run `make dev-init`. The wizard configures `.env`, provisions an ngrok domain, and launches Docker.
2. Open the ngrok domain in a browser — you should see an error saying the page must be opened inside Bitrix24. That confirms the app is running.
3. Register the app in your Bitrix24 portal:
   - **Main URL:** `[ngrok-domain]/`
   - **Install URL:** `[ngrok-domain]/install`
   - **Scopes:** `crm`, `user_brief`, `pull`, `placement`, `userfieldconfig`
4. Put `CLIENT_ID` and `CLIENT_SECRET` from the portal into `.env`, then restart: `make down && make dev-node`.
5. Reinstall the app inside your portal to refresh tokens.

### Manual setup

```bash
cp .env.example .env
make dev-node          # frontend + NestJS + ngrok
make down              # stop everything
```

### Production checklist

- `JWT_SECRET` — JWT encryption between frontend and backend
- `DB_USER`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL credentials
- `BUILD_TARGET=production` — Nuxt production build

## Environment

Configuration lives in `.env` (not committed). Key variables:

| Variable           | Purpose                                  |
|--------------------|------------------------------------------|
| `VIRTUAL_HOST`     | Public URL (set by ngrok or your domain) |
| `NGROK_AUTHTOKEN`  | ngrok auth token                         |
| `CLIENT_ID`        | Bitrix24 app client ID                   |
| `CLIENT_SECRET`    | Bitrix24 app client secret               |
| `JWT_SECRET`       | JWT signing key                          |
| `DB_NAME/USER/PASSWORD` | PostgreSQL credentials (default: appdb/appuser/apppass) |
| `ENABLE_RABBITMQ`  | Set to `1` to include queue profile      |
| `BUILD_TARGET`     | Docker build stage (`dev` or `production`) |

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

- `apps/front-end/app/pages/` — pages (`.client.vue` files, rendered in Bitrix24 iframe)
- `apps/front-end/app/stores/` — Pinia stores
- `apps/front-end/app/composables/` — shared logic
- `apps/front-end/app/layouts/` — `default`, `placement`, `slider`, `uf-placement`
- `apps/front-end/app/components/` — Vue components

### Conventions

- All pages are `.client.vue` (client-side only, Bitrix24 iframe)
- Wrap everything in `<B24App>` for global providers
- Components from `@bitrix24/b24ui-nuxt`, icons from `@bitrix24/b24icons-vue`
- State management via Pinia stores
- Tailwind CSS 4 via Vite plugin

## Widgets, Events, Robots

If your feature involves widgets, events, or robots, review these docs first:

- **Widgets:** [API reference](https://github.com/bitrix-tools/b24-rest-docs/tree/main/api-reference/widgets) | [Widget guide](./instructions/bitrix24/widget.md)
- **Events:** [API reference](https://github.com/bitrix-tools/b24-rest-docs/tree/main/api-reference/events) — register via `event.bind` during installation
- **Robots:** [CRM robot guide](./instructions/bitrix24/crm-robot.md) — register via `bizproc.robot.add`

## Queues & RabbitMQ

- Enable with `ENABLE_RABBITMQ=1` in `.env`
- Broker: AMQP `5672`, management UI `15672`
- Manual control: `make queue-up`, `make queue-down`
- Guide: `instructions/queues/node.md`

## Instructions System (for AI agents)

Entry point: `instructions/knowledge.md`

```
instructions/
├── knowledge.md              # central hub — start here
├── node/knowledge.md         # NestJS backend patterns
├── node/code-review.md       # backend code review standards
├── front/knowledge.md        # frontend (Nuxt/B24UI) guide
├── front/*.md                # component-specific guides
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
- UI Kit docs: https://bitrix24.github.io/b24ui/
- UI Kit AI README: https://github.com/bitrix24/b24ui/blob/main/README-AI.md
- Icons: https://bitrix24.github.io/b24icons/

## License

Licensed under MIT. See [LICENSE](./LICENSE) for details.
