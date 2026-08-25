import { Module } from "@nestjs/common";
import { PrismaModule } from "@libs/prisma";

import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
