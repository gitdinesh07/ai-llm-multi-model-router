import type { RequestHandler } from "express";
import { AppError } from "../../core/errors/app-error.js";
import { AuthService } from "../../core/auth/auth.service.js";

export function apiKeyAuthMiddleware(authService: AuthService): RequestHandler {
  return async (req, _res, next) => {
    try {
      req.auth = await authService.authenticateApiKey(req.header("x-api-key") ?? undefined);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function adminApiKeyMiddleware(adminApiKey: string): RequestHandler {
  return (req, _res, next) => {
    const received = req.header("x-admin-api-key");
    if (received !== adminApiKey) {
      next(new AppError(401, "Missing or invalid x-admin-api-key", "ADMIN_UNAUTHORIZED"));
      return;
    }
    next();
  };
}
