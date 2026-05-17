import type { Request, Response, NextFunction } from "express";
import { createUserSchema, updatePolicySchema } from "../../core/llm/llm.schemas.js";
import { UsageService } from "../../core/usage/usage.service.js";
import { UserService } from "../../core/users/user.service.js";
import { ProviderRegistry } from "../../providers/provider-registry.js";

export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly usageService: UsageService,
    private readonly providerRegistry: ProviderRegistry
  ) {}

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createUserSchema.parse(req.body);
      const user = await this.userService.createUser(input);
      res.status(201).json({ data: user, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };

  createApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.issueApiKey(Number.parseInt(String(req.params.id), 10));
      res.status(201).json({ data: result, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };

  updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updatePolicySchema.parse(req.body);
      const user = await this.userService.updatePolicy({
        userId: Number.parseInt(String(req.params.id), 10),
        ...input
      });
      res.json({ data: user, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };

  usage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usage = await this.usageService.getUsageSummary();
      res.json({ data: usage, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };

  listProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providers = this.providerRegistry.all();
      const results = await Promise.all(providers.map(async (provider) => {
        try {
          const models = await provider.listModels();
          return {
            provider: provider.name,
            status: "available",
            models: models.map((info) => ({ name: info.name, metadata: info.metadata }))
          };
        } catch (error) {
          return {
            provider: provider.name,
            status: "unavailable",
            models: [],
            error: error instanceof Error ? error.message : "Provider discovery failed"
          };
        }
      }));

      // Sort results alphabetically by provider name
      results.sort((left, right) => left.provider.localeCompare(right.provider));

      res.json({ data: results, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };
}
