---
paths:
  - "migrations/"
  - "migrations/**"
---

# Migration Rules (`migrations/`)

Schema is owned by **dbmate** — plain SQL files in this directory. There is **no ORM-generated schema and no codegen**: these files plus the `Database` interface in `apps/back-end/src/entities/index.ts` are the two sources of truth, and they must be kept in sync by hand.

## How they run

The one-shot `dbmate` Docker service runs `dbmate up` on `docker compose up` (after Postgres is healthy); the `back-end` service waits for it via `service_completed_successfully`. So migrations apply **before** the API starts — never from Node. Applied versions live in the `schema_migrations` table; the service runs with `--no-dump-schema` (no `schema.sql` is generated).

## Authoring

- **Always scaffold with** `docker compose run --rm dbmate new <name>` — never hand-name files. dbmate names them `<UTC-timestamp>_<name>.sql`, and that timestamp is the apply order. Hand-picking timestamps risks ordering collisions.
- Each file has two sections — fill **both**:
  ```sql
  -- migrate:up
  CREATE TABLE ...;

  -- migrate:down
  DROP TABLE ...;
  ```
- `down` must exactly reverse `up` (drop in reverse dependency order — children before parents) so `dbmate down` leaves a clean schema.
- dbmate wraps each migration in a transaction by default. For statements that can't run in one (e.g. `CREATE INDEX CONCURRENTLY`), add `-- migrate:up transaction:false` to that section's header.

## Applying

You don't have to restart the stack to apply a new migration — run the dbmate service directly:

```bash
docker compose run --rm dbmate up        # apply all pending migrations
docker compose run --rm dbmate status    # see applied / pending before & after
docker compose run --rm dbmate down      # roll back the most recent migration
```

`dbmate up` is idempotent — already-applied files are skipped, so it's safe to run repeatedly. On the next `docker compose up`/`restart` the one-shot service applies them automatically anyway; this is just the way to do it without bouncing the API. (The service reads `DATABASE_URL` and `DBMATE_MIGRATIONS_DIR=/migrations` from `docker-compose.yml`, so no flags are needed.)

## Discipline

- **Migrations are append-only.** Never edit or delete a migration that may already be applied anywhere — write a new one to alter the schema. Only edit a file that has never left your working tree.
- **Every schema change here must be mirrored by hand** in the `Database` interface in `apps/back-end/src/entities/index.ts` (column names, nullability, types). Forgetting this is the most common bug — Kysely's types silently drift from the real schema.
- Keep raw SQL portable to Postgres 17; match the existing conventions (`uuid` PKs via `uuid_generate_v4()`, `timestamp(3)`, snake_case columns).
- One logical change per migration; don't bundle unrelated DDL.
