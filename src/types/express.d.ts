import type { AuthenticatedApiKeyContext } from "../core/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedApiKeyContext;
      requestId?: string;
      traceId?: string;
      startedAt?: number;
    }
  }
}

export {};
