# Bitrix24 Application Starter Kit


Bitrix24 app skeleton using a simplified OAuth 2.0 installation flow. Registers two default widgets: a CRM deal tab and a custom CRM field widget.

## Important
- If the user asks for a LARGE change or feature, use the **builder** skill
- NEVER implement half baked front-end prototypes using local storage, only mock data placed in separate files (if specifically requested)

## Project Structure

```
├── apps/
│   ├── back-end/         # Express 5 API (port 3000)
│   └── front-end/        # React 19 + Vite SPA
├── packages/
│   ├── contracts/        # @common/contracts — API contracts (Zod, routes, types)
│   └── bitrix/               # @common/bitrix — B24 React hooks, atoms, provider
├── migrations/           # dbmate SQL migrations (applied by the dbmate service)
├── docs/                 # AI agent docs (back-end/, front-end/, bitrix24/)
└── docker-compose.yml    # Dev services: apps + PostgreSQL, RabbitMQ, MinIO, dbmate
```

## Rules (auto-loaded by path)

Area-specific guidance lives in `.claude/rules/` and loads when you touch matching files:

- `backend.md` → `apps/back-end/**` — auth/security, multi-tenancy, DB/migrations, routes
- `frontend.md` → `apps/front-end/**`, `packages/bitrix/**` — React/Vite conventions, B24 platform
- `contracts.md` → `packages/contracts/**` — contract definitions & types
- `migrations.md` → `migrations/**` — dbmate SQL migration authoring & discipline

## Commits

- **Always** follow commitlint conventional config.
- **NEVER** add Claude signatures to commits.

## Dev Servers

- **NEVER** run dev servers directly (`pnpm dev`, `vite`, …) — use `docker compose` exclusively.
- Check output with `docker compose logs back-end` / `docker compose logs front-end`.

## Tech Stack

- **Backend:** Express 5, Kysely — `apps/back-end/`
- **Frontend:** React 19, Vite, Tailwind CSS 4, shadcn/ui, Jotai, TanStack Query, `@common/bitrix` — `apps/front-end/` (organised **feature-first** under `src/features/<name>/`; see `docs/front-end/feature-structure.md`)
- **Database:** PostgreSQL 17 (Kysely query builder, dbmate migrations) · **Queue:** RabbitMQ 3.13 · **Storage:** MinIO (S3)

## Dev Services

`docker compose up` starts everything; routing goes through **Forge** (Traefik):

| Service    | Forge Route                | Purpose            |
| ---------- | -------------------------- | ------------------ |
| front-end  | `b24-template.local/`      | Vite dev server    |
| back-end   | `b24-template.local/api`   | Express API        |
| minio      | `b24-template.local/files` | S3 storage         |
| PostgreSQL | (internal)                 | Database           |
| dbmate     | (internal, one-shot)       | Runs migrations    |
| RabbitMQ   | (internal)                 | Message queue      |

## Environment

Config in `.env` (copy from `.env.example`): DB (`DB_*`), RabbitMQ (`RABBITMQ_*`), S3 (`S3_*`), `JWT_SECRET`, Bitrix24 OAuth (`CLIENT_ID`, `CLIENT_SECRET`), `NODE_ENV`, `API_URL`.

## Workflow

1. Copy `.env.example` → `.env` and fill credentials.
2. `docker compose up`.
3. Register the app in your Bitrix24 portal with the public URL.

## Docs (AI agents)

Two layers: path-scoped quick rules in `.claude/rules/` (auto-loaded per area) link into deeper how-tos under `docs/` (`back-end/`, `front-end/`, `bitrix24/`). For Bitrix24 specifics, invoke the `bitrix` skill.

## Resources

- REST API: https://apidocs.bitrix24.com
- JS SDK: https://github.com/bitrix24/b24jssdk
