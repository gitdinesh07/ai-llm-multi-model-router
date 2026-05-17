import type { Request, Response, NextFunction } from "express";
import { createUserSchema, updatePolicySchema } from "../../core/llm/llm.schemas.js";
import { UsageService } from "../../core/usage/usage.service.js";
import { UserService } from "../../core/users/user.service.js";

export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly usageService: UsageService
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
}
