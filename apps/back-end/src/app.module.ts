import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApiModule } from "./api/api.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ApiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
