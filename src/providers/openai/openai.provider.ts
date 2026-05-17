import { AppError } from "../../core/errors/app-error.js";
import { env } from "../../infra/config/env.js";
import type {
  GenerationRequest,
  GenerationResponse,
  LLMProvider,
  StreamChunk
} from "../shared/provider.types.js";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";

  async listModels(): Promise<string[]> {
    return env.openAiDefaultModels;
  }

  async generate(input: GenerationRequest): Promise<GenerationResponse> {
    if (!env.OPENAI_API_KEY) {
      throw new AppError(500, "OPENAI_API_KEY is not configured", "PROVIDER_OPENAI_NOT_CONFIGURED");
    }

    const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        top_p: input.topP,
        stream: false
      })
    });

    if (!response.ok) {
      throw new AppError(response.status, "OpenAI request failed", "PROVIDER_OPENAI_ERROR", await safeJson(response));
    }

    const payload = await response.json();
    return {
      provider: this.name,
      model: input.model,
      content: payload.choices?.[0]?.message?.content ?? "",
      finishReason: payload.choices?.[0]?.finish_reason ?? "stop",
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens: payload.usage?.total_tokens ?? 0
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
