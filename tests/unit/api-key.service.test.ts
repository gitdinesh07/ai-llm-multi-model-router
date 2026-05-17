import { describe, expect, it } from "vitest";
import { ApiKeyService } from "../../src/core/auth/api-key.service.js";

describe("ApiKeyService", () => {
  it("issues hashed keys and validates them", async () => {
    const service = new ApiKeyService();
    const issued = await service.issue();

    expect(issued.rawKey.startsWith("llmr_")).toBe(true);
    expect(issued.keyHash).not.toBe(issued.rawKey);
    await expect(service.matches(issued.rawKey, issued.keyHash)).resolves.toBe(true);
  });
});
