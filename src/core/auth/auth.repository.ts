import type { PrismaClient } from "@prisma/client";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveKeysByPrefix(keyPrefix: string) {
    return this.prisma.apiKey.findMany({
      where: {
        keyPrefix,
        status: "ACTIVE"
      },
      include: {
        user: true
      }
    });
  }

  async touchApiKey(apiKeyId: number) {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() }
    });
  }

  async findUsageBudget(userId: number) {
    return this.prisma.usageBudget.findUnique({
      where: { userId }
    });
  }
}
