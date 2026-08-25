import { Injectable } from '@nestjs/common'
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

@Injectable()
export class PrometheusService {
  readonly registry = new Registry()

  readonly callsInitiated = new Counter({
    name: 'calls_initiated_total',
    help: 'Total calls initiated',
    registers: [this.registry],
  })

  readonly callsCompleted = new Counter({
    name: 'calls_completed_total',
    help: 'Total calls completed',
    labelNames: ['status'],
    registers: [this.registry],
  })

  readonly webhookDuration = new Histogram({
    name: 'webhook_duration_seconds',
    help: 'Webhook processing duration',
    registers: [this.registry],
  })

  constructor() { collectDefaultMetrics({ register: this.registry }) }
}
