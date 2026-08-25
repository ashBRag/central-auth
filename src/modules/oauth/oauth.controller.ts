import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FastifyReply } from "fastify";
import { OAuthService } from "./oauth.service";
import { SessionCodeDto } from "./oauth.dto";

@ApiTags("oauth")
@Controller("auth/oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get(":provider")
  async startAuthorization(
    @Param("provider") provider: string,
    @Query("redirect_slug") redirectSlug: string,
    @Res() reply: FastifyReply
  ): Promise<void> {
    const authorizationUrl = await this.oauthService.buildAuthorizationUrl(
      provider,
      redirectSlug
    );
    reply.redirect(authorizationUrl, 302);
  }

  @Get(":provider/callback")
  async callback(
    @Param("provider") provider: string,
    @Query() query: Record<string, string | undefined>,
    @Res() reply: FastifyReply
  ): Promise<void> {
    const { redirectUrl } = await this.oauthService.handleCallback(
      provider,
      query
    );
    reply.redirect(redirectUrl, 302);
  }

  @Post("session")
  @HttpCode(HttpStatus.OK)
  exchangeSessionCode(@Body() dto: SessionCodeDto) {
    return this.oauthService.exchangeSessionCode(dto.sessionCode);
  }
}
