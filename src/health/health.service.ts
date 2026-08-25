import { Injectable } from "@nestjs/common";
import { PrismaService } from "@libs/prisma";
import { RedisService } from "@libs/redis";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async checkApp() {
    return { status: "up" };
  }

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "up" };
    } catch {
      return { status: "down" };
    }
  }

  async checkRedis() {
    try {
      await this.redis.ping();
      return { status: "up" };
    } catch {
      return { status: "down" };
    }
  }

  async checkAll() {
    const [app, database, redis] = await Promise.all([
      this.checkApp(),
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const status =
      database.status === "up" && redis.status === "up" ? "ok" : "error";

    return {
      status,
      services: {
        app,
        database,
        redis,
      },
    };
  }
}
