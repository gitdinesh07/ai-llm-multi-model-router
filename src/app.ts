import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { AuthRepository } from "./core/auth/auth.repository.js";
import { ApiKeyService } from "./core/auth/api-key.service.js";
import { AuthService } from "./core/auth/auth.service.js";
import { LlmService } from "./core/llm/llm.service.js";
import { ModelPolicyRepository } from "./core/models/model-policy.repository.js";
import { ModelPolicyService } from "./core/models/model-policy.service.js";
import { TraceService } from "./core/telemetry/trace.service.js";
import { UsageRepository } from "./core/usage/usage.repository.js";
import { UsageService } from "./core/usage/usage.service.js";
import { UserRepository } from "./core/users/user.repository.js";
import { UserService } from "./core/users/user.service.js";
import { env } from "./infra/config/env.js";
import { prisma } from "./infra/db/prisma.js";
import { createInfraRouter } from "./infra/http/health.routes.js";
import { logger } from "./infra/logging/logger.js";
import { createV1Router } from "./api/routes/v1.js";
import { LlmController } from "./api/controllers/llm.controller.js";
import { AdminController } from "./api/controllers/admin.controller.js";
import { requestContextMiddleware } from "./api/middleware/request-context.middleware.js";
import { errorMiddleware } from "./api/middleware/error.middleware.js";
import { ProviderRegistry } from "./providers/provider-registry.js";
import { OpenAIProvider } from "./providers/openai/openai.provider.js";
import { OllamaProvider } from "./providers/ollama/ollama.provider.js";
import { openApiDocument } from "./infra/http/openapi.js";

export function createApp() {
  const app = express();

  const authRepository = new AuthRepository(prisma);
  const apiKeyService = new ApiKeyService();
  const authService = new AuthService(authRepository, apiKeyService);
  const modelPolicyService = new ModelPolicyService(new ModelPolicyRepository(prisma));
  const usageService = new UsageService(new UsageRepository(prisma));
  const userService = new UserService(new UserRepository(prisma), apiKeyService);
  const traceService = new TraceService();
  const providerRegistry = new ProviderRegistry([
    new OpenAIProvider(),
    new OllamaProvider()
  ]);
  const llmService = new LlmService(providerRegistry, modelPolicyService, usageService, traceService);
  const llmController = new LlmController(llmService, modelPolicyService);
  const adminController = new AdminController(userService, usageService);

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(requestContextMiddleware);
  app.use((req, res, next) => {
    logger.info({
      method: req.method,
      path: req.path,
      requestId: req.requestId,
      traceId: req.traceId
    }, "Incoming request");

    res.on("finish", () => {
      logger.info({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestId: req.requestId,
        traceId: req.traceId
      }, "Request completed");
    });

    next();
  });

  app.use(createInfraRouter());
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/v1", createV1Router({
    authService,
    adminApiKey: env.ADMIN_API_KEY,
    llmController,
    adminController
  }));

  app.use(errorMiddleware);

  return app;
}
