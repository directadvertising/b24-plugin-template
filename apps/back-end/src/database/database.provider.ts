import { Inject, type Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kysely, PostgresDialect } from "kysely";
import * as pg from "pg";
import type { Database } from "./database.types";

export const DATABASE_TOKEN = Symbol("DATABASE_CONNECTION");

export type DatabaseConnection = Kysely<Database>;

export const InjectDatabase = (): ParameterDecorator => Inject(DATABASE_TOKEN);

export const databaseProvider: Provider = {
  provide: DATABASE_TOKEN,
  useFactory: (config: ConfigService): DatabaseConnection => {
    const dialect = new PostgresDialect({
      pool: new pg.Pool({
        host: config.get<string>("DB_HOST", "localhost"),
        port: config.get<number>("DB_PORT", 5432),
        database: config.get<string>("DB_NAME", "appdb"),
        user: config.get<string>("DB_USER", "appuser"),
        password: config.get<string>("DB_PASSWORD", "apppass"),
        max: 10,
      }),
    });

    return new Kysely<Database>({ dialect });
  },
  inject: [ConfigService],
};
