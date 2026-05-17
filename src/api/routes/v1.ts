import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { LlmController } from "../controllers/llm.controller.js";
import { UserController } from "../controllers/user.controller.js";
import { apiKeyAuthMiddleware, adminApiKeyMiddleware } from "../middleware/auth.middleware.js";
import type { AuthService } from "../../core/auth/auth.service.js";

export function createV1Router(params: {
  authService: AuthService;
  adminApiKey: string;
  llmController: LlmController;
  adminController: AdminController;
  userController: UserController;
}) {
  const router = Router();

  router.get("/me", apiKeyAuthMiddleware(params.authService), params.userController.me);

  // router.get("/providers", apiKeyAuthMiddleware(params.authService), params.llmController.listProviders);
  router.get("/providers", apiKeyAuthMiddleware(params.authService), params.adminController.listProviders);
  router.get("/models", apiKeyAuthMiddleware(params.authService), params.llmController.listModels);
  router.post("/inference", apiKeyAuthMiddleware(params.authService), params.llmController.generate);
  router.post("/inference/stream", apiKeyAuthMiddleware(params.authService), params.llmController.stream);

  router.post("/admin/users", adminApiKeyMiddleware(params.adminApiKey), params.adminController.createUser);
  router.post("/admin/users/:id/keys", adminApiKeyMiddleware(params.adminApiKey), params.adminController.createApiKey);
  router.patch("/admin/users/:id/policy", adminApiKeyMiddleware(params.adminApiKey), params.adminController.updatePolicy);
  router.get("/admin/usage", adminApiKeyMiddleware(params.adminApiKey), params.adminController.usage);
  router.get("/admin/providers", adminApiKeyMiddleware(params.adminApiKey), params.adminController.listProviders);

  return router;
}
