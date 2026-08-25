import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { RefreshTokenRequestUser } from "../refresh-jwt.strategy";

export const CurrentRefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RefreshTokenRequestUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user: RefreshTokenRequestUser }>();
    return request.user;
  }
);
