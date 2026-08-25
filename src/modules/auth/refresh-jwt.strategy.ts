import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { FastifyRequest } from "fastify";
import { RefreshTokenPayload } from "./jwt-payload.interface";

export interface RefreshTokenRequestUser {
  id: string;
  email: string;
  refreshToken: string;
}

const extractFromBody = (req: FastifyRequest): string | null => {
  const body = req.body as { refreshToken?: string } | undefined;
  return body?.refreshToken ?? null;
};

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh"
) {
  constructor() {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET environment variable must be set.");
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractFromBody,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  validate(
    req: FastifyRequest,
    payload: RefreshTokenPayload
  ): RefreshTokenRequestUser {
    if (!payload?.sub || payload.type !== "refresh") {
      throw new UnauthorizedException();
    }
    const refreshToken = extractFromBody(req);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required.");
    }
    return { id: payload.sub, email: payload.email, refreshToken };
  }
}
