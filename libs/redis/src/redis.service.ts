import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    super(process.env.REDIS_URL ?? "redis://redis:6379");
  }

  async onModuleInit(): Promise<void> {
    await this.ping();
    this.logger.log("Connected to Redis");
  }

  async onModuleDestroy(): Promise<void> {
    this.disconnect();
  }
}
