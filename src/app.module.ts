import { Module } from "@nestjs/common";
import { LoggerModule } from "@libs/logger";
import { PrometheusModule } from "@libs/prometheus";
import { PrismaModule } from "@libs/prisma";
import { RedisModule } from "@libs/redis";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OAuthModule } from "./modules/oauth/oauth.module";

@Module({
  imports: [
    LoggerModule,
    PrometheusModule.forRoot(),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    OAuthModule,
  ],
})
export class AppModule {}
