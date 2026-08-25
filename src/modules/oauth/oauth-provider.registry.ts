import { Injectable } from "@nestjs/common";
import { Issuer, Client } from "openid-client";
import { PrismaService } from "@libs/prisma";
import { NotFoundError } from "../../errors/app-errors";
import { OAuthProviderConfigError } from "./oauth-errors";

interface ResolvedProvider {
  slug: string;
  client: Client;
}

@Injectable()
export class OAuthProviderRegistry {
  private readonly clients = new Map<string, Client>();

  constructor(private readonly prisma: PrismaService) {}

  async resolve(slug: string): Promise<ResolvedProvider> {
    const cached = this.clients.get(slug);
    if (cached) {
      return { slug, client: cached };
    }

    const providerConfig = await this.prisma.oidcProvider.findUnique({
      where: { slug },
    });

    if (!providerConfig) {
      throw new NotFoundError(`OAuth provider "${slug}" is not configured.`);
    }

    if (!providerConfig.enabled) {
      throw new NotFoundError(`OAuth provider "${slug}" is not configured.`);
    }

    let issuer: Issuer;
    try {
      issuer = await Issuer.discover(providerConfig.issuerUrl);
    } catch {
      throw new OAuthProviderConfigError(
        `Unable to discover OAuth provider "${slug}".`
      );
    }

    const client = new issuer.Client({
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      redirect_uris: [providerConfig.callbackUrl],
      response_types: ["code"],
    });

    this.clients.set(slug, client);
    return { slug, client };
  }
}
