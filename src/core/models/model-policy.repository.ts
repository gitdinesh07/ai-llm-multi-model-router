import type { PrismaClient } from "@prisma/client";

export class ModelPolicyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllowedModel(userId: number, provider: string, model: string) {
    return this.prisma.userModelAccess.findFirst({
      where: {
        userId,
        providerModel: {
          provider,
          model,
          enabled: true
        }
      },
      include: {
        providerModel: true
      }
    });
  }

  async listAllowedModels(userId: number) {
    const accesses = await this.prisma.userModelAccess.findMany({
      where: { userId, providerModel: { enabled: true } },
      include: { providerModel: true },
      orderBy: [{ providerModel: { provider: "asc" } }, { providerModel: { model: "asc" } }]
    });

    return accesses.map((entry) => ({
      provider: entry.providerModel.provider,
      model: entry.providerModel.model
    }));
  }
}
