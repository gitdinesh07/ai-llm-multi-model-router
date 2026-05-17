import { Router } from "express";
import { metricsRegistry } from "../../core/telemetry/metrics.js";

export function createInfraRouter() {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get("/metrics", async (_req, res) => {
    res.setHeader("Content-Type", metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  });

  return router;
}
