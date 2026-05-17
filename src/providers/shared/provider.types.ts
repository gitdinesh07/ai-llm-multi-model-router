import type { UsageSnapshot } from "../../core/usage/usage.types.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerationRequest = {
  provider: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  metadata?: Record<string, unknown>;
};

export type GenerationResponse = {
  provider: string;
  model: string;
  content: string;
  finishReason: string;
  usage: UsageSnapshot;
  raw?: unknown;
};

export type StreamChunk = {
  contentDelta: string;
  done?: boolean;
  usage?: UsageSnapshot;
  finishReason?: string;
};

export type ProviderModelInfo = {
  name: string;
  metadata?: {
    parameterSize?: string;
    quantizationLevel?: string;
    family?: string;
    specialization?: string;
    useCases?: string[];
    [key: string]: unknown;
  };
};

export interface LLMProvider {
  readonly name: string;
  listModels(): Promise<ProviderModelInfo[]>;
  generate(input: GenerationRequest): Promise<GenerationResponse>;
  streamGenerate(input: GenerationRequest): AsyncGenerator<StreamChunk, void, void>;
}
