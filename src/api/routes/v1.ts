import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { LlmController } from "../controllers/llm.controller.js";
import { apiKeyAuthMiddleware, adminApiKeyMiddleware } from "../middleware/auth.middleware.js";
import type { AuthService } from "../../core/auth/auth.service.js";

export function createV1Router(params: {
  authService: AuthService;
  adminApiKey: string;
  llmController: LlmController;
  adminController: AdminController;
}) {
  const router = Router();

  router.get("/providers", apiKeyAuthMiddleware(params.authService), params.llmController.listProviders);
  router.get("/models", apiKeyAuthMiddleware(params.authService), params.llmController.listModels);
  router.post("/inference", apiKeyAuthMiddleware(params.authService), params.llmController.generate);
  router.post("/inference/stream", apiKeyAuthMiddleware(params.authService), params.llmController.stream);

  router.post("/admin/users", adminApiKeyMiddleware(params.adminApiKey), params.adminController.createUser);
  router.post("/admin/users/:id/keys", adminApiKeyMiddleware(params.adminApiKey), params.adminController.createApiKey);
  router.patch("/admin/users/:id/policy", adminApiKeyMiddleware(params.adminApiKey), params.adminController.updatePolicy);
  router.get("/admin/usage", adminApiKeyMiddleware(params.adminApiKey), params.adminController.usage);

  return router;
}
