import { describe, expect, it } from "vitest";

describe("infra routes", () => {
  it("returns health status", async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/llm_router";
    process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "test-admin-key";
    const { createInfraRouter } = await import("../../src/infra/http/health.routes.js");
    const router = createInfraRouter();
    const layer = router.stack.find((entry) => entry.route?.path === "/health");
    const handler = layer?.route?.stack?.[0]?.handle as ((req: unknown, res: unknown, next: () => void) => void) | undefined;
    const payloads: unknown[] = [];

    const res = {
      json(payload: unknown) {
        payloads.push(payload);
      }
    };

    expect(handler).toBeTypeOf("function");
    handler!({} as never, res as never, () => undefined);

    expect(payloads[0]).toEqual({ status: "ok" });
  });
});
