import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common'
import pino from 'pino'

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger = pino({
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  })

  log(msg: string, ctx?: string)   { this.logger.info({ ctx }, msg) }
  error(msg: string, ctx?: string) { this.logger.error({ ctx }, msg) }
  warn(msg: string, ctx?: string)  { this.logger.warn({ ctx }, msg) }
  debug(msg: string, ctx?: string) { this.logger.debug({ ctx }, msg) }
}
