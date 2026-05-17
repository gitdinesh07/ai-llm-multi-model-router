import { trace } from "@opentelemetry/api";
import { Client as LangSmithClient } from "langsmith";
import { env } from "../../infra/config/env.js";

export class TraceService {
  private readonly tracer = trace.getTracer("llm-router");
  private readonly langSmith = env.LANGSMITH_API_KEY
    ? new LangSmithClient({
        apiKey: env.LANGSMITH_API_KEY
      })
    : null;

  startSpan(name: string) {
    return this.tracer.startSpan(name);
  }

  async recordRun(input: {
    name: string;
    traceId: string;
    input: unknown;
    output?: unknown;
    error?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!this.langSmith) {
      return;
    }

    await this.langSmith.createRun({
      name: input.name,
      run_type: "llm",
      inputs: { payload: input.input },
      outputs: input.output ? { payload: input.output } : undefined,
      error: input.error,
      project_name: env.LANGSMITH_PROJECT,
      end_time: Date.now(),
      extra: {
        metadata: {
          traceId: input.traceId,
          ...input.metadata
        }
      }
    });
  }
}
