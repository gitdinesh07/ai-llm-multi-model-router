import type { UsageBudget } from "@prisma/client";
import { AppError } from "../errors/app-error.js";
import type { UsageSnapshot } from "./usage.types.js";
import { UsageRepository } from "./usage.repository.js";

export class UsageService {
  constructor(private readonly repository: UsageRepository) {}

  assertWithinQuota(usageBudget: UsageBudget | null, requestedTokens = 0) {
    if (!usageBudget) {
      return;
    }

    const nextTotal = usageBudget.consumedTokens + requestedTokens;
    if (nextTotal > usageBudget.tokenLimit) {
      throw new AppError(403, "User token quota exhausted", "USAGE_QUOTA_EXHAUSTED");
    }
  }

  async recordDeniedRequest(userId: number, requestId: string, reason: string) {
    await this.repository.createQuotaEvent(userId, requestId, reason);
  }

  async recordSuccessfulRequest(params: {
    userId: number;
    provider: string;
    model: string;
    requestId: string;
    traceId: string;
    latencyMs: number;
    usage: UsageSnapshot;
    metadata?: Record<string, unknown>;
  }) {
    await this.repository.incrementBudget(params.userId, params.usage.totalTokens);
    await this.repository.persistRequest({
      userId: params.userId,
      provider: params.provider,
      model: params.model,
      requestId: params.requestId,
      traceId: params.traceId,
      status: "SUCCESS",
      promptTokens: params.usage.promptTokens,
      completionTokens: params.usage.completionTokens,
      totalTokens: params.usage.totalTokens,
      latencyMs: params.latencyMs,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : undefined
    });
  }

  async recordFailedRequest(params: {
    userId: number;
    provider: string;
    model: string;
    requestId: string;
    traceId: string;
    latencyMs: number;
    errorMessage: string;
  }) {
    await this.repository.persistRequest({
      userId: params.userId,
      provider: params.provider,
      model: params.model,
      requestId: params.requestId,
      traceId: params.traceId,
      status: "FAILED",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: params.latencyMs,
      errorMessage: params.errorMessage
    });
  }

  async getUsageSummary() {
    return this.repository.getUsageSummary();
  }
}
