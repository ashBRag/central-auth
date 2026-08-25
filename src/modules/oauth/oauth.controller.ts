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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { FastifyReply } from "fastify";
import { OAuthService } from "./oauth.service";
import { SessionCodeDto, TokenPairResponseDto } from "./oauth.dto";

@ApiTags("oauth")
@Controller("auth/oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get(":provider")
  @ApiOperation({
    summary: "Start an external OAuth/OIDC authorization flow.",
    description:
      "Resolves the provider and redirect_slug against server-side registries, generates state/nonce/PKCE, stores the OAuth transaction in Redis, and redirects the browser to the provider's authorization endpoint.",
  })
  @ApiParam({
    name: "provider",
    description: 'Configured OAuth provider slug, e.g. "google".',
    example: "google",
  })
  @ApiQuery({
    name: "redirect_slug",
    description:
      "Slug identifying the allowlisted frontend redirect destination (see RedirectTarget registry).",
    required: true,
    example: "default",
  })
  @ApiResponse({ status: 302, description: "Redirect to the provider's authorization URL." })
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
  @ApiOperation({
    summary: "Complete an external OAuth/OIDC authorization flow.",
    description:
      "Validates the OAuth transaction and provider response, resolves/creates the internal user and identity, then redirects to the transaction's success URL with a one-time ?session_code=, or to its error URL with a safe ?error= code on failure. Exchange the session code via POST /auth/oauth/session to obtain tokens.",
  })
  @ApiParam({
    name: "provider",
    description: 'Configured OAuth provider slug, e.g. "google".',
    example: "google",
  })
  @ApiQuery({ name: "code", required: false, description: "Authorization code from the provider." })
  @ApiQuery({ name: "state", required: false, description: "State returned by the provider, matched against the stored transaction." })
  @ApiQuery({ name: "error", required: false, description: "OAuth error code from the provider, e.g. access_denied." })
  @ApiResponse({
    status: 302,
    description: "Redirect to the configured frontend success or error destination.",
  })
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
  @ApiOperation({
    summary: "Exchange a one-time OAuth session code for an access/refresh token pair.",
    description:
      "The session code is single-use and short-lived, returned as ?session_code= on the OAuth callback's success redirect. Issues tokens via the same mechanism as email/password login.",
  })
  @ApiResponse({ status: 200, type: TokenPairResponseDto })
  exchangeSessionCode(@Body() dto: SessionCodeDto): Promise<TokenPairResponseDto> {
    return this.oauthService.exchangeSessionCode(dto.sessionCode);
  }
}
