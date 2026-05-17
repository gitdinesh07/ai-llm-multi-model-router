import { describe, expect, it } from "vitest";
import { ProviderRegistry } from "../../src/providers/provider-registry.js";

describe("ProviderRegistry", () => {
  it("resolves a provider by name", () => {
    const registry = new ProviderRegistry([{
      name: "openai",
      listModels: async () => ["gpt-4o-mini"],
      generate: async () => ({
        provider: "openai",
        model: "gpt-4o-mini",
        content: "ok",
        finishReason: "stop",
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 }
      }),
      streamGenerate: async function * () {
        yield {
          contentDelta: "ok",
          done: true,
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          finishReason: "stop"
        };
      }
    }]);

    expect(registry.get("openai").name).toBe("openai");
  });
});
