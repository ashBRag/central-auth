import { Module } from "@nestjs/common";
import { PrismaModule } from "@libs/prisma";
import { RedisModule } from "@libs/redis";
import { AuthModule } from "../auth/auth.module";
import { OAuthController } from "./oauth.controller";
import { OAuthService } from "./oauth.service";
import { OAuthProviderRegistry } from "./oauth-provider.registry";
import { RedirectTargetRegistry } from "./redirect-target.registry";

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [OAuthController],
  providers: [OAuthService, OAuthProviderRegistry, RedirectTargetRegistry],
})
export class OAuthModule {}
