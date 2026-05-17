import { AppError } from "../errors/app-error.js";
import { ModelPolicyRepository } from "./model-policy.repository.js";

export class ModelPolicyService {
  constructor(private readonly repository: ModelPolicyRepository) {}

  async assertModelAccess(userId: number, provider: string, model: string) {
    const allowed = await this.repository.findAllowedModel(userId, provider, model);
    if (!allowed) {
      throw new AppError(403, "Model access is not allowed for this user", "POLICY_MODEL_DENIED");
    }
  }

  async listAllowedModels(userId: number) {
    return this.repository.listAllowedModels(userId);
  }
}
