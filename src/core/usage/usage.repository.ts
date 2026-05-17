import type { PrismaClient, RequestStatus } from "@prisma/client";

export type PersistRequestParams = {
  userId: number;
  provider: string;
  model: string;
  requestId: string;
  traceId: string;
  status: RequestStatus;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  errorMessage?: string;
  metadataJson?: string;
};

export class UsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async incrementBudget(userId: number, totalTokens: number) {
    await this.prisma.usageBudget.update({
      where: { userId },
      data: {
        consumedTokens: {
          increment: totalTokens
        }
      }
    });
  }

  async persistRequest(params: PersistRequestParams) {
    await this.prisma.llmRequest.create({
      data: params
    });
  }

  async createQuotaEvent(userId: number, requestId: string, reason: string) {
    await this.prisma.quotaEvent.create({
      data: {
        userId,
        requestId,
        reason
      }
    });
  }

  async getUsageSummary() {
    return this.prisma.llmRequest.groupBy({
      by: ["userId", "provider", "model", "status"],
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { _all: true }
    });
  }
}
