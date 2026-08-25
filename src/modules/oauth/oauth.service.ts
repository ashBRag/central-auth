import { Injectable } from "@nestjs/common";
import { generators, errors as openidErrors } from "openid-client";
import { RedisService } from "@libs/redis";
import { PrismaService } from "@libs/prisma";
import { AuthService } from "../auth/auth.service";
import { OAuthProviderRegistry } from "./oauth-provider.registry";
import { RedirectTargetRegistry } from "./redirect-target.registry";
import { OAuthTransaction } from "./oauth-transaction.interface";
import {
  OAuthProviderConfigError,
  OAuthTransactionError,
  OAuthAccountLinkingRequiredError,
  OAuthSessionCodeError,
} from "./oauth-errors";
import { randomBytes } from "crypto";

const TRANSACTION_TTL_SECONDS = 10 * 60;
const SESSION_CODE_TTL_SECONDS = 60;

function transactionKey(state: string): string {
  return `oauth:transaction:${state}`;
}

function sessionCodeKey(code: string): string {
  return `oauth:session:${code}`;
}

export interface OAuthCallbackResult {
  redirectUrl: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly redirectTargetRegistry: RedirectTargetRegistry,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async buildAuthorizationUrl(
    slug: string,
    redirectSlug?: string
  ): Promise<string> {
    if (!redirectSlug) {
      throw new OAuthTransactionError("A redirect_slug query parameter is required.");
    }

    const { client } = await this.providerRegistry.resolve(slug);
    const { successUrl, errorUrl } =
      await this.redirectTargetRegistry.resolve(redirectSlug);

    const state = generators.state();
    const nonce = generators.nonce();
    const pkceVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(pkceVerifier);

    const now = Date.now();
    const transaction: OAuthTransaction = {
      provider: slug,
      state,
      nonce,
      pkceVerifier,
      successUrl,
      errorUrl,
      createdAt: now,
      expiresAt: now + TRANSACTION_TTL_SECONDS * 1000,
    };

    await this.redis.set(
      transactionKey(state),
      JSON.stringify(transaction),
      "EX",
      TRANSACTION_TTL_SECONDS
    );

    let authorizationUrl: string;
    try {
      authorizationUrl = client.authorizationUrl({
        scope: "openid email profile",
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
    } catch {
      throw new OAuthProviderConfigError(
        `Unable to generate an authorization URL for "${slug}".`
      );
    }

    return authorizationUrl;
  }

  async handleCallback(
    slug: string,
    query: Record<string, string | undefined>
  ): Promise<OAuthCallbackResult> {
    const state = query.state;
    const transaction = state
      ? await this.consumeTransaction(state)
      : undefined;

    if (!transaction || transaction.provider !== slug) {
      throw new OAuthTransactionError();
    }

    if (query.error) {
      return { redirectUrl: this.buildErrorRedirect(transaction.errorUrl, "oauth_denied") };
    }

    if (!query.code) {
      return { redirectUrl: this.buildErrorRedirect(transaction.errorUrl, "oauth_failed") };
    }

    try {
      const userId = await this.resolveAuthenticatedUser(slug, query, transaction);
      const sessionCode = await this.createSessionCode(userId);
      const redirectUrl = new URL(transaction.successUrl);
      redirectUrl.searchParams.set("session_code", sessionCode);
      return { redirectUrl: redirectUrl.toString() };
    } catch (err) {
      if (err instanceof OAuthAccountLinkingRequiredError) {
        return {
          redirectUrl: this.buildErrorRedirect(
            transaction.errorUrl,
            "account_link_required"
          ),
        };
      }
      if (err instanceof openidErrors.OPError || err instanceof openidErrors.RPError) {
        return {
          redirectUrl: this.buildErrorRedirect(transaction.errorUrl, "oauth_failed"),
        };
      }
      throw err;
    }
  }

  async exchangeSessionCode(code: string) {
    const key = sessionCodeKey(code);
    const raw = await this.redis.get(key);
    if (!raw) {
      throw new OAuthSessionCodeError();
    }
    await this.redis.del(key);

    const { userId } = JSON.parse(raw) as { userId: string };
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new OAuthSessionCodeError();
    }

    return this.authService.issueTokenPair({ id: user.id, email: user.email });
  }

  private async consumeTransaction(
    state: string
  ): Promise<OAuthTransaction | undefined> {
    const key = transactionKey(state);
    const raw = await this.redis.get(key);
    if (!raw) {
      return undefined;
    }
    await this.redis.del(key);

    const transaction = JSON.parse(raw) as OAuthTransaction;
    if (transaction.expiresAt < Date.now()) {
      return undefined;
    }
    return transaction;
  }

  private async resolveAuthenticatedUser(
    slug: string,
    query: Record<string, string | undefined>,
    transaction: OAuthTransaction
  ): Promise<string> {
    const { client } = await this.providerRegistry.resolve(slug);

    const tokenSet = await client.callback(undefined, query, {
      state: transaction.state,
      nonce: transaction.nonce,
      code_verifier: transaction.pkceVerifier,
    });

    const claims = tokenSet.claims();
    const providerSubject = claims.sub;
    const email = typeof claims.email === "string" ? claims.email : undefined;
    const emailVerified = claims.email_verified === true;

    const existingIdentity = await this.prisma.identity.findUnique({
      where: { provider_providerSubject: { provider: slug, providerSubject } },
    });

    if (existingIdentity) {
      return existingIdentity.userId;
    }

    if (!email) {
      throw new OAuthAccountLinkingRequiredError(
        "Provider did not return an email for this identity."
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new OAuthAccountLinkingRequiredError();
    }

    if (!emailVerified) {
      throw new OAuthAccountLinkingRequiredError(
        "Email must be verified by the provider to create an account."
      );
    }

    return this.createUserWithIdentity(slug, providerSubject, email, emailVerified);
  }

  private async createUserWithIdentity(
    provider: string,
    providerSubject: string,
    email: string,
    emailVerified: boolean
  ): Promise<string> {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash: null,
          },
        });

        await tx.identity.create({
          data: {
            provider,
            providerSubject,
            email: email.toLowerCase(),
            emailVerified,
            userId: createdUser.id,
          },
        });

        return createdUser;
      });

      return user.id;
    } catch {
      const identity = await this.prisma.identity.findUnique({
        where: {
          provider_providerSubject: { provider, providerSubject },
        },
      });
      if (identity) {
        return identity.userId;
      }
      throw new OAuthAccountLinkingRequiredError();
    }
  }

  private async createSessionCode(userId: string): Promise<string> {
    const code = randomBytes(32).toString("base64url");
    await this.redis.set(
      sessionCodeKey(code),
      JSON.stringify({ userId }),
      "EX",
      SESSION_CODE_TTL_SECONDS
    );
    return code;
  }

  private buildErrorRedirect(errorUrl: string, code: string): string {
    const url = new URL(errorUrl);
    url.searchParams.set("error", code);
    return url.toString();
  }
}
