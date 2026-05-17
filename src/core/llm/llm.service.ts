import { randomUUID } from "node:crypto";
import type { AuthenticatedApiKeyContext } from "../auth/auth.types.js";
import { ModelPolicyService } from "../models/model-policy.service.js";
import { TraceService } from "../telemetry/trace.service.js";
import { latencyHistogram, requestCounter, tokenCounter } from "../telemetry/metrics.js";
import { UsageService } from "../usage/usage.service.js";
import { ProviderRegistry } from "../../providers/provider-registry.js";
import type { GenerationRequest } from "../../providers/shared/provider.types.js";

type ProviderCatalogEntry = {
  provider: string;
  status: "available" | "unavailable";
  models: Array<{
    name: string;
    accessible: boolean;
  }>;
  error?: string;
};

export class LlmService {
  constructor(
    private readonly providerRegistry: ProviderRegistry,
    private readonly modelPolicyService: ModelPolicyService,
    private readonly usageService: UsageService,
    private readonly traceService: TraceService
  ) {}

  async generate(auth: AuthenticatedApiKeyContext, input: GenerationRequest, requestId: string, traceId: string) {
    await this.modelPolicyService.assertModelAccess(auth.user.id, input.provider, input.model);
    this.usageService.assertWithinQuota(auth.usageBudget);

    const provider = this.providerRegistry.get(input.provider);
    const startedAt = Date.now();
    const span = this.traceService.startSpan("llm.generate");

    try {
      const result = await provider.generate(input);
      this.usageService.assertWithinQuota(auth.usageBudget, result.usage.totalTokens);
      const latencyMs = Date.now() - startedAt;

      await this.usageService.recordSuccessfulRequest({
        userId: auth.user.id,
        provider: input.provider,
        model: input.model,
        requestId,
        traceId,
        latencyMs,
        usage: result.usage,
        metadata: input.metadata
      });

      requestCounter.inc({ provider: input.provider, model: input.model, status: "success" });
      tokenCounter.inc({ provider: input.provider, model: input.model, type: "prompt" }, result.usage.promptTokens);
      tokenCounter.inc({ provider: input.provider, model: input.model, type: "completion" }, result.usage.completionTokens);
      tokenCounter.inc({ provider: input.provider, model: input.model, type: "total" }, result.usage.totalTokens);
      latencyHistogram.observe({ provider: input.provider, model: input.model }, latencyMs);

      await this.traceService.recordRun({
        name: `${input.provider}:${input.model}`,
        traceId,
        input,
        output: result,
        metadata: {
          userId: auth.user.id,
          requestId
        }
      });

      return {
        requestId,
        traceId,
        latencyMs,
        ...result
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      requestCounter.inc({ provider: input.provider, model: input.model, status: "failed" });

      await this.usageService.recordFailedRequest({
        userId: auth.user.id,
        provider: input.provider,
        model: input.model,
        requestId,
        traceId,
        latencyMs,
        errorMessage: error instanceof Error ? error.message : "Unknown provider error"
      });

      await this.traceService.recordRun({
        name: `${input.provider}:${input.model}`,
        traceId,
        input,
        error: error instanceof Error ? error.message : "Unknown provider error",
        metadata: {
          userId: auth.user.id,
          requestId
        }
      });

      throw error;
    } finally {
      span.end();
    }
  }

  async *stream(auth: AuthenticatedApiKeyContext, input: GenerationRequest, requestId: string, traceId: string) {
    await this.modelPolicyService.assertModelAccess(auth.user.id, input.provider, input.model);
    this.usageService.assertWithinQuota(auth.usageBudget);

    const provider = this.providerRegistry.get(input.provider);
    const startedAt = Date.now();
    let collectedContent = "";
    let finalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finishReason = "stop";

    try {
      for await (const chunk of provider.streamGenerate(input)) {
        collectedContent += chunk.contentDelta;
        if (chunk.usage) {
          finalUsage = chunk.usage;
        }
        if (chunk.finishReason) {
          finishReason = chunk.finishReason;
        }
        yield { requestId, traceId, ...chunk };
      }

      this.usageService.assertWithinQuota(auth.usageBudget, finalUsage.totalTokens);
      const latencyMs = Date.now() - startedAt;
      await this.usageService.recordSuccessfulRequest({
        userId: auth.user.id,
        provider: input.provider,
        model: input.model,
        requestId,
        traceId,
        latencyMs,
        usage: finalUsage,
        metadata: input.metadata
      });

      requestCounter.inc({ provider: input.provider, model: input.model, status: "success" });
      tokenCounter.inc({ provider: input.provider, model: input.model, type: "prompt" }, finalUsage.promptTokens);
      tokenCounter.inc({ provider: input.provider, model: input.model, type: "completion" }, finalUsage.completionTokens);
      tokenCounter.inc({ provider: input.provider, model: input.model, type: "total" }, finalUsage.totalTokens);
      latencyHistogram.observe({ provider: input.provider, model: input.model }, latencyMs);

      await this.traceService.recordRun({
        name: `${input.provider}:${input.model}:stream`,
        traceId,
        input,
        output: {
          content: collectedContent,
          finishReason,
          usage: finalUsage
        },
        metadata: {
          userId: auth.user.id,
          requestId
        }
      });
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      requestCounter.inc({ provider: input.provider, model: input.model, status: "failed" });
      await this.usageService.recordFailedRequest({
        userId: auth.user.id,
        provider: input.provider,
        model: input.model,
        requestId,
        traceId,
        latencyMs,
        errorMessage: error instanceof Error ? error.message : "Unknown stream error"
      });
      throw error;
    }
  }

  async listProviderCatalog(auth: AuthenticatedApiKeyContext): Promise<ProviderCatalogEntry[]> {
    const allowedModels = await this.modelPolicyService.listAllowedModels(auth.user.id);
    const allowedByProvider = new Map<string, Set<string>>();

    for (const entry of allowedModels) {
      const models = allowedByProvider.get(entry.provider) ?? new Set<string>();
      models.add(entry.model);
      allowedByProvider.set(entry.provider, models);
    }

    const providers = this.providerRegistry.all();
    const results = await Promise.all(providers.map(async (provider) => {
      try {
        const models = await provider.listModels();
        const accessibleSet = allowedByProvider.get(provider.name) ?? new Set<string>();

        return {
          provider: provider.name,
          status: "available" as const,
          models: models.map((name) => ({
            name,
            accessible: accessibleSet.has(name)
          }))
        };
      } catch (error) {
        return {
          provider: provider.name,
          status: "unavailable" as const,
          models: [],
          error: error instanceof Error ? error.message : "Provider discovery failed"
        };
      }
    }));

    return results.sort((left, right) => left.provider.localeCompare(right.provider));
  }

  createRequestIds() {
    return {
      requestId: randomUUID(),
      traceId: randomUUID()
    };
  }
}
