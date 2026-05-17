import { AppError } from "../errors/app-error.js";
import { ApiKeyService } from "../auth/api-key.service.js";
import { UserRepository } from "./user.repository.js";

export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly apiKeyService: ApiKeyService
  ) {}

  async createUser(input: { email: string; name: string; tokenLimit: number; isAdmin?: boolean }) {
    const { rawKey, keyHash, keyPrefix } = await this.apiKeyService.issue();
    const user = await this.repository.createUser({
      ...input,
      resetAt: defaultMonthlyReset(),
      keyHash,
      keyPrefix
    });

    return {
      ...user,
      apiKey: rawKey,
      keyPrefix
    };
  }

  async issueApiKey(userId: number) {
    const { rawKey, keyHash, keyPrefix } = await this.apiKeyService.issue();
    await this.repository.createApiKey(userId, keyHash, keyPrefix);
    return { apiKey: rawKey, keyPrefix };
  }

  async updatePolicy(input: {
    userId: number;
    status?: "ACTIVE" | "BLOCKED";
    tokenLimit?: number;
    allowedModels?: Array<{ provider: string; model: string }>;
  }) {
    let providerModelIds: number[] | undefined;

    if (input.allowedModels) {
      const providerModels = await this.repository.findProviderModels(input.allowedModels);
      if (providerModels.length !== input.allowedModels.length) {
        throw new AppError(400, "One or more provider/model combinations are not registered", "ADMIN_UNKNOWN_MODEL");
      }
      providerModelIds = providerModels.map((entry) => entry.id);
    }

    return this.repository.updateUserPolicy({
      userId: input.userId,
      status: input.status,
      tokenLimit: input.tokenLimit,
      providerModelIds
    });
  }
}

function defaultMonthlyReset() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}
