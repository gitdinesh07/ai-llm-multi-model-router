import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContextMiddleware: RequestHandler = (req, _res, next) => {
  req.requestId = req.header("x-request-id") ?? randomUUID();
  req.traceId = randomUUID();
  req.startedAt = Date.now();
  next();
};
