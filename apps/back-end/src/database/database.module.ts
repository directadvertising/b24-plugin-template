import {
  Logger,
  Module,
  type OnApplicationShutdown,
  type OnModuleInit,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { type Kysely, Migrator } from "kysely";
import * as MIGRATIONS from "@/migrations";
import { DATABASE_TOKEN, databaseProvider } from "./database.provider";
import type { Database } from "./database.types";

@Module({
  providers: [databaseProvider],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit(): Promise<void> {
    const db = this.moduleRef.get<Kysely<Database>>(DATABASE_TOKEN);

    const migrator = new Migrator({
      db,
      provider: {
        getMigrations: async () => MIGRATIONS,
      },
    });

    const { error, results } = await migrator.migrateToLatest();

    for (const result of results ?? []) {
      if (result.status === "Success") {
        this.logger.log(`Migration "${result.migrationName}" executed`);
      } else if (result.status === "Error") {
        this.logger.error(`Migration "${result.migrationName}" failed`);
      }
    }

    if (error) {
      this.logger.error("Migration failed", error);
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    const db = this.moduleRef.get<Kysely<Database>>(DATABASE_TOKEN);
    await db.destroy();
  }
}
