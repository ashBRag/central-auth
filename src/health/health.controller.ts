import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async check(@Res() res: FastifyReply) {
    const result = await this.health.checkAll();
    const httpStatus =
      result.status === "ok" ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(httpStatus).send(result);
  }
}
