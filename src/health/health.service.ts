import { Injectable } from "@nestjs/common";
import { PrismaService } from "@libs/prisma";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

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

  async checkAll() {
    const [app, database] = await Promise.all([
      this.checkApp(),
      this.checkDatabase(),
    ]);

    const status = database.status === "up" ? "ok" : "error";

    return {
      status,
      services: {
        app,
        database,
      },
    };
  }
}
