import { AppError } from "../../core/errors/app-error.js";
import { env } from "../../infra/config/env.js";
import type {
  GenerationRequest,
  GenerationResponse,
  LLMProvider,
  StreamChunk
} from "../shared/provider.types.js";

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";

  async listModels(): Promise<string[]> {
    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
      method: "GET"
    });

    if (!response.ok) {
      throw new AppError(response.status, "Failed to fetch Ollama models", "PROVIDER_OLLAMA_MODELS_ERROR", await safeJson(response));
    }

    const payload = await response.json();
    const models = Array.isArray(payload.models)
      ? payload.models
          .map((entry: { name?: string; model?: string }) => entry.name ?? entry.model)
          .filter((value: string | undefined): value is string => Boolean(value))
      : [];

    return models.length > 0 ? models : env.ollamaDefaultModels;
  }

  async generate(input: GenerationRequest): Promise<GenerationResponse> {
    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        stream: false,
        options: {
          temperature: input.temperature,
          top_p: input.topP,
          num_predict: input.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new AppError(response.status, "Ollama request failed", "PROVIDER_OLLAMA_ERROR", await safeJson(response));
    }

    const payload = await response.json();
    const promptTokens = payload.prompt_eval_count ?? 0;
    const completionTokens = payload.eval_count ?? 0;
    return {
      provider: this.name,
      model: input.model,
      content: payload.message?.content ?? "",
      finishReason: payload.done ? "stop" : "unknown",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      },
      raw: payload
    };
  }

  async *streamGenerate(input: GenerationRequest): AsyncGenerator<StreamChunk, void, void> {
    const result = await this.generate(input);
    yield {
      contentDelta: result.content,
      done: true,
      usage: result.usage,
      finishReason: result.finishReason
    };
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
