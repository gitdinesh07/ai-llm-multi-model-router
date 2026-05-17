import type { ApiKey, UsageBudget, User } from "@prisma/client";

export type AuthenticatedApiKeyContext = {
  user: User;
  apiKey: ApiKey;
  usageBudget: UsageBudget | null;
};
