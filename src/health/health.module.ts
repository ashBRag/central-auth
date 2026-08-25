import { Module } from "@nestjs/common";
import { PrismaModule } from "@libs/prisma";
import { RedisModule } from "@libs/redis";

import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
