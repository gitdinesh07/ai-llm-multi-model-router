import { AppError } from "../errors/app-error.js";
import { ApiKeyService } from "./api-key.service.js";
import { AuthRepository } from "./auth.repository.js";
import type { AuthenticatedApiKeyContext } from "./auth.types.js";

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly apiKeyService: ApiKeyService
  ) {}

  async authenticateApiKey(rawKey: string | undefined): Promise<AuthenticatedApiKeyContext> {
    if (!rawKey) {
      throw new AppError(401, "Missing x-api-key header", "AUTH_MISSING_API_KEY");
    }

    const keyPrefix = rawKey.slice(0, 10);
    const candidates = await this.authRepository.findActiveKeysByPrefix(keyPrefix);

    for (const candidate of candidates) {
      const isMatch = await this.apiKeyService.matches(rawKey, candidate.keyHash);
      if (!isMatch) {
        continue;
      }

      if (candidate.user.status !== "ACTIVE") {
        throw new AppError(403, "User is blocked", "AUTH_USER_BLOCKED");
      }

      await this.authRepository.touchApiKey(candidate.id);
      const usageBudget = await this.authRepository.findUsageBudget(candidate.userId);
      return {
        user: candidate.user,
        apiKey: candidate,
        usageBudget
      };
    }

    throw new AppError(401, "Invalid API key", "AUTH_INVALID_API_KEY");
  }
}
