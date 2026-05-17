import type { Request, Response, NextFunction } from "express";
import { inferenceRequestSchema } from "../../core/llm/llm.schemas.js";
import { LlmService } from "../../core/llm/llm.service.js";
import { ModelPolicyService } from "../../core/models/model-policy.service.js";

export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly modelPolicyService: ModelPolicyService
  ) {}

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.auth!;
      const input = inferenceRequestSchema.parse(req.body);
      const result = await this.llmService.generate(auth, input, req.requestId!, req.traceId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  stream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.auth!;
      const input = inferenceRequestSchema.parse(req.body);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of this.llmService.stream(auth, input, req.requestId!, req.traceId!)) {
        res.write(`event: chunk\n`);
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ requestId: req.requestId, traceId: req.traceId })}\n\n`);
      res.end();
    } catch (error) {
      next(error);
    }
  };

  listModels = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const models = await this.modelPolicyService.listAllowedModels(req.auth!.user.id);
      res.json({ data: models, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };

  listProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const providers = await this.llmService.listProviderCatalog(req.auth!);
      res.json({ data: providers, requestId: req.requestId, traceId: req.traceId });
    } catch (error) {
      next(error);
    }
  };
}
