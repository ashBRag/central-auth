import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { AppError } from "./app-errors";

/**
 * Global exception filter that handles all exceptions thrown in the application.
 * It catches both custom AppError instances and standard HttpException instances,
 * as well as any unknown exceptions, logging them and returning a standardized error response.
 *
 * @example
 * // In your main.ts or app.module.ts, you can apply this filter globally:
 * app.useGlobalFilters(new AllExceptionsFilter());
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof AppError) {
      return this.handleAppError(exception, reply);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, reply);
    }

    return this.handleUnknownException(exception, reply);
  }

  private handleAppError(exception: AppError, reply: FastifyReply): void {
    reply
      .status(exception.getStatus())
      .send({ error: exception.getResponse() });
  }

  private handleHttpException(
    exception: HttpException,
    reply: FastifyReply
  ): void {
    const status = exception.getStatus();
    const response = exception.getResponse();

    reply.status(status).send({
      error: {
        code: this.getErrorCode(status),
        message: this.getMessage(response),
      },
    });
  }

  private handleUnknownException(
    exception: unknown,
    reply: FastifyReply
  ): void {
    this.logger.error(exception instanceof Error ? exception.stack : exception);

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });
  }

  private getErrorCode(status: number): string {
    return HttpStatus[status]?.toUpperCase() ?? "HTTP_ERROR";
  }

  private getMessage(response: string | object): string {
    if (typeof response === "string") {
      return response;
    }

    const message = (response as { message?: string | string[] }).message;

    return Array.isArray(message)
      ? message.join(" ")
      : message ?? "Request failed.";
  }
}
