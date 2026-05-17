import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";
import { env } from "../../infra/config/env.js";

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry, prefix: env.METRICS_PREFIX });

export const requestCounter = new Counter({
  name: `${env.METRICS_PREFIX}requests_total`,
  help: "Total inference requests",
  labelNames: ["provider", "model", "status"],
  registers: [metricsRegistry]
});

export const tokenCounter = new Counter({
  name: `${env.METRICS_PREFIX}tokens_total`,
  help: "Total tokens consumed",
  labelNames: ["provider", "model", "type"],
  registers: [metricsRegistry]
});

export const latencyHistogram = new Histogram({
  name: `${env.METRICS_PREFIX}request_latency_ms`,
  help: "Inference latency in milliseconds",
  labelNames: ["provider", "model"],
  buckets: [50, 100, 250, 500, 1000, 3000, 10000],
  registers: [metricsRegistry]
});
