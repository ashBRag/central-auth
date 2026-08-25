import { Module, Global, DynamicModule } from '@nestjs/common'
import { PrometheusService } from './prometheus.service'
import { PrometheusController } from './prometheus.controller'

@Global()
@Module({})
export class PrometheusModule {
  static forRoot(): DynamicModule {
    return {
      module: PrometheusModule,
      providers: [PrometheusService],
      controllers: [PrometheusController],
      exports: [PrometheusService],
    }
  }
}
