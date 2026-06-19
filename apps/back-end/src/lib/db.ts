import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "../entities";

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "appdb",
    user: process.env.DB_USER ?? "appuser",
    password: process.env.DB_PASSWORD ?? "apppass",
    max: 10,
  }),
});

// Query handle only — it does NOT run migrations. Schema is owned by dbmate
// (SQL in the root `migrations/` dir); the `Database` interface in `entities/`
// is the hand-maintained TypeScript mirror.
export const db = new Kysely<Database>({ dialect });
