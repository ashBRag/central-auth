import { Controller, Get, Res } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { PrometheusService } from './prometheus.service'

@Controller('metrics')
export class PrometheusController {
  constructor(private readonly svc: PrometheusService) {}

  @Get()
  async metrics(@Res() res: FastifyReply) {
    res.header('Content-Type', this.svc.registry.contentType)
    res.send(await this.svc.registry.metrics())
  }
}
