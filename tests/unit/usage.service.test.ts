import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/core/errors/app-error.js";
import { UsageService } from "../../src/core/usage/usage.service.js";

describe("UsageService", () => {
  it("blocks requests that exceed quota", () => {
    const service = new UsageService({
      incrementBudget: vi.fn(),
      persistRequest: vi.fn(),
      createQuotaEvent: vi.fn(),
      getUsageSummary: vi.fn()
    } as never);

    expect(() => service.assertWithinQuota({
      id: 1,
      userId: 1,
      period: "MONTHLY",
      tokenLimit: 100,
      consumedTokens: 95,
      resetAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, 10)).toThrowError(AppError);
  });
});
