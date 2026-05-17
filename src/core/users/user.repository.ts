import type { PrismaClient, UserStatus } from "@prisma/client";

export type CreateUserInput = {
  email: string;
  name: string;
  isAdmin?: boolean;
  tokenLimit: number;
  resetAt: Date;
  keyHash: string;
  keyPrefix: string;
};

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(input: CreateUserInput) {
    return this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          isAdmin: input.isAdmin ?? false,
          usageBudget: {
            create: {
              tokenLimit: input.tokenLimit,
              resetAt: input.resetAt
            }
          },
          apiKeys: {
            create: {
              keyHash: input.keyHash,
              keyPrefix: input.keyPrefix
            }
          }
        },
        include: {
          usageBudget: true
        }
      });
    });
  }

  async createApiKey(userId: number, keyHash: string, keyPrefix: string) {
    return this.prisma.apiKey.create({
      data: { userId, keyHash, keyPrefix }
    });
  }

  async updateUserPolicy(input: {
    userId: number;
    status?: UserStatus;
    tokenLimit?: number;
    providerModelIds?: number[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (input.status) {
        await tx.user.update({
          where: { id: input.userId },
          data: { status: input.status }
        });
      }

      if (typeof input.tokenLimit === "number") {
        await tx.usageBudget.update({
          where: { userId: input.userId },
          data: { tokenLimit: input.tokenLimit }
        });
      }

      if (input.providerModelIds) {
        await tx.userModelAccess.deleteMany({
          where: { userId: input.userId }
        });

        if (input.providerModelIds.length > 0) {
          await tx.userModelAccess.createMany({
            data: input.providerModelIds.map((providerModelId) => ({
              userId: input.userId,
              providerModelId
            }))
          });
        }
      }

      return tx.user.findUnique({
        where: { id: input.userId },
        include: {
          usageBudget: true,
          modelAccess: {
            include: {
              providerModel: true
            }
          }
        }
      });
    });
  }

  async findProviderModels(providerModels: Array<{ provider: string; model: string }>) {
    return this.prisma.providerModel.findMany({
      where: {
        OR: providerModels
      }
    });
  }
}
