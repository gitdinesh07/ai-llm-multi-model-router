import type { Request, Response, NextFunction } from "express";
import { LlmService } from "../../core/llm/llm.service.js";
import { ModelPolicyService } from "../../core/models/model-policy.service.js";

export class UserController {
  constructor(
    private readonly llmService: LlmService,
    private readonly modelPolicyService: ModelPolicyService
  ) {}

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.auth!;
      const user = auth.user;
      const budget = auth.usageBudget;
      
      const models = await this.modelPolicyService.listAllowedModels(user.id);

      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          models,
          quota: budget ? {
            limit: budget.tokenLimit,
            used: budget.consumedTokens,
            left: Math.max(0, budget.tokenLimit - budget.consumedTokens)
          } : null,
        },
        requestId: req.requestId,
        traceId: req.traceId
      });
    } catch (error) {
      next(error);
    }
  };
}
