import { Injectable } from "@nestjs/common";
import { PrismaService } from "@libs/prisma";
import { NotFoundError } from "../../errors/app-errors";

export interface ResolvedRedirectTarget {
  successUrl: string;
  errorUrl: string;
}

@Injectable()
export class RedirectTargetRegistry {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(slug: string): Promise<ResolvedRedirectTarget> {
    const target = await this.prisma.redirectTarget.findUnique({
      where: { slug },
    });

    if (!target || !target.enabled) {
      throw new NotFoundError(`Redirect target "${slug}" is not configured.`);
    }

    return { successUrl: target.successUrl, errorUrl: target.errorUrl };
  }
}
