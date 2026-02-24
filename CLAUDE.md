# Bitrix24 Application Starter Kit

Bitrix24 app skeleton using a simplified OAuth 2.0 installation flow.
Registers two default widgets: a CRM deal tab and a custom CRM field widget.

## Project Structure

```
├── apps/
│   ├── back-end/         # NestJS API (port 8000)
│   └── front-end/        # Nuxt 4 + Vue 3 + Bitrix24 UI Kit
│       ├── app/          # pages, components, composables, stores
│       ├── i18n/         # localization
│       └── nuxt.config.ts
├── packages/
│   └── contracts/        # @common/contracts — API contracts (Zod schemas, routes, types)
├── infrastructure/
│   └── database/init.sql
└── instructions/         # AI agent knowledge base (see below)
```

## Tech Stack

- **Backend:** NestJS — `apps/back-end/`
- **Frontend:** Nuxt 4, Vue 3, Tailwind CSS 4, Pinia, `@bitrix24/b24ui-nuxt` — `apps/front-end/`
- **Database:** PostgreSQL 17 (Alpine)

## Environment

Configuration lives in `.env` (not committed). Key variables:

- `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL credentials (defaults: appdb/appuser/apppass)
- `NODE_ENV` — `development` or `production`

## Instructions System (for AI agents)

Entry point: `instructions/knowledge.md`

```
instructions/
├── knowledge.md              # central hub — start here
├── node/knowledge.md         # Node.js backend patterns
├── node/code-review.md       # Node.js code review standards
├── front/knowledge.md        # frontend (Nuxt/B24UI) guide
├── front/*.md                # component-specific guides
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
- **UI Kit** — `@bitrix24/b24ui-nuxt`; all components are `B24*` prefixed
- **Core CRM entities:** Leads, Deals, Contacts, Companies, Activities

## Frontend Conventions

- All pages are `.client.vue` (rendered in Bitrix24 iframe)
- Wrap everything in `<B24App>` for global providers (toast, tooltip, overlay)
- Components come from `@bitrix24/b24ui-nuxt`, not plain Nuxt UI
- Icons from `@bitrix24/b24icons-vue`
- State management via Pinia stores in `app/stores/`
- Tailwind CSS 4 via Vite plugin

## Contracts (`packages/contracts/`)

All API contracts live in `packages/contracts/` (package `@common/contracts`). The single contract object is exported as **`$`** from `packages/contracts/src/index.ts`. All routes are defined on `$`, and `$` is used for `@BindContract` binding and type extraction throughout the project.

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

| Property      | Type                | Required | Purpose                                         |
|---------------|---------------------|----------|--------------------------------------------------|
| `method`      | HTTP verb           | yes      | GET, POST, PUT, PATCH, DELETE                    |
| `name`        | string              | yes      | Human-readable identifier                        |
| `description` | string              | yes      | Detailed explanation                             |
| `path`        | string              | yes      | URL pattern (`:param` placeholders)              |
| `params`      | Zod object \| null  | if path has `:param` | URL parameter validation            |
| `query`       | Zod schema \| null  | yes      | Query string validation                          |
| `body`        | Zod schema \| null  | yes      | Request payload validation                       |
| `data`        | Zod schema \| null  | yes      | Success response schema                          |
| `errorCodes`  | string[]            | yes      | Custom error identifiers                         |

**Path handling:** After creation, `path` becomes a callable function — `path()` for static paths, `path({ id: "123" })` for parameterized ones. Original template available via `pathTemplate`.

**Type inference — use the `$` namespace:**

- `$.Route` — union of all route names
- `$.Body<"routeName">` — request body type
- `$.Query<"routeName">` — query params type
- `$.Params<"routeName">` — URL params type
- `$.Data<"routeName">` — response data type

**Response envelope:** All responses follow `{ success: true, data: T }` on success and `{ success: false, error: { code, message } }` on failure. The server validates return values against the `data` schema (500 on mismatch).

## Backend Contract Usage (`contracts-nestjs`)

Use `@BindContract` from `contracts-nestjs` on controller methods — it replaces `@Get()` / `@Post()` decorators entirely and auto-wires routing, validation, and response formatting from the contract definition. Always import `$` from `@common/contracts`.

```ts
import { BindContract } from "contracts-nestjs";
import { $ } from "@common/contracts";

@Controller()
export class MyFeatureController {
  @BindContract($, "getItems")
  async getItems(@Query() query: $.Query<"getItems">) {
    // return raw data — automatically wrapped as { success: true, data }
    return items;
  }
}
```

**What `@BindContract` handles automatically:**

- **Routing** — HTTP method + path derived from the contract route
- **Input validation** — body, query, params validated against Zod schemas; invalid → 400
- **Response wrapping** — return value `T` wrapped as `{ success: true, data: T }`
- **Output validation** — response checked against `data` schema; mismatch → 500
- **Error formatting** — all errors follow `{ success: false, error: { code, message } }`

## Development Workflow

1. Copy `.env.example` to `.env` and fill in credentials
2. Build and run with Docker
3. Register the app in your Bitrix24 portal with the public URL

## Resources

- REST API docs: https://apidocs.bitrix24.com
- JS SDK: https://github.com/bitrix24/b24jssdk
- UI Kit docs: https://bitrix24.github.io/b24ui/
- UI Kit AI README: https://github.com/bitrix24/b24ui/blob/main/README-AI.md
- Icons: https://bitrix24.github.io/b24icons/
- Starter template: https://github.com/bitrix24/starter-b24ui
