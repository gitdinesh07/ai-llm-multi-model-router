import { AppError } from "../core/errors/app-error.js";
import type { LLMProvider } from "./shared/provider.types.js";

export class ProviderRegistry {
  constructor(private readonly providers: LLMProvider[]) {}

  get(providerName: string): LLMProvider {
    const provider = this.providers.find((entry) => entry.name === providerName);
    if (!provider) {
      throw new AppError(400, `Unsupported provider: ${providerName}`, "PROVIDER_UNSUPPORTED");
    }
    return provider;
  }

  all(): LLMProvider[] {
    return [...this.providers];
  }
}
