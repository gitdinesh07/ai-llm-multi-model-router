import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1)
});

export const inferenceRequestSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  messages: z.array(chatMessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional()
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  tokenLimit: z.number().int().nonnegative(),
  isAdmin: z.boolean().optional()
});

export const updatePolicySchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  tokenLimit: z.number().int().nonnegative().optional(),
  allowedModels: z.array(z.object({
    provider: z.string().min(1),
    model: z.string().min(1)
  })).optional()
});
