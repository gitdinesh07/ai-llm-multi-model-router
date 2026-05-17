import type { ErrorRequestHandler } from "express";
import { AppError } from "../../core/errors/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      requestId: req.requestId,
      traceId: req.traceId
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error instanceof Error ? error.message : "Unknown error"
    },
    requestId: req.requestId,
    traceId: req.traceId
  });
};
