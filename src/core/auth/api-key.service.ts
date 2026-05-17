import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const API_KEY_PREFIX = "llmr";

export class ApiKeyService {
  async issue(): Promise<{ rawKey: string; keyHash: string; keyPrefix: string }> {
    const secret = crypto.randomBytes(24).toString("hex");
    const rawKey = `${API_KEY_PREFIX}_${secret}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.slice(0, 10);
    return { rawKey, keyHash, keyPrefix };
  }

  async matches(rawKey: string, keyHash: string): Promise<boolean> {
    return bcrypt.compare(rawKey, keyHash);
  }
}
