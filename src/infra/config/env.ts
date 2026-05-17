import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  OPENAI_DEFAULT_MODELS: z.string().default(""),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_DEFAULT_MODELS: z.string().default(""),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().default("llm-router"),
  METRICS_PREFIX: z.string().default("llm_router_")
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  openAiDefaultModels: parsed.OPENAI_DEFAULT_MODELS.split(",").map((value) => value.trim()).filter(Boolean),
  ollamaDefaultModels: parsed.OLLAMA_DEFAULT_MODELS.split(",").map((value) => value.trim()).filter(Boolean)
};
