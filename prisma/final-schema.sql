DROP TABLE IF EXISTS quota_events CASCADE;
DROP TABLE IF EXISTS llm_requests CASCADE;
DROP TABLE IF EXISTS usage_budgets CASCADE;
DROP TABLE IF EXISTS user_model_access CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS provider_models CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS "RequestStatus" CASCADE;
DROP TYPE IF EXISTS "BudgetPeriod" CASCADE;
DROP TYPE IF EXISTS "ApiKeyStatus" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY');
CREATE TYPE "RequestStatus" AS ENUM ('SUCCESS', 'FAILED', 'DENIED');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  "keyPrefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  status "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE provider_models (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE user_model_access (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "providerModelId" INTEGER NOT NULL REFERENCES provider_models(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_budgets (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  period "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY',
  "tokenLimit" INTEGER NOT NULL,
  "consumedTokens" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE llm_requests (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  "requestId" TEXT NOT NULL UNIQUE,
  "traceId" TEXT NOT NULL,
  status "RequestStatus" NOT NULL,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "latencyMs" INTEGER NOT NULL,
  "errorMessage" TEXT,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quota_events (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "requestId" TEXT NOT NULL,
  reason TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX api_keys_userId_status_idx ON api_keys ("userId", status);
CREATE UNIQUE INDEX provider_models_provider_model_key ON provider_models (provider, model);
CREATE UNIQUE INDEX user_model_access_userId_providerModelId_key ON user_model_access ("userId", "providerModelId");
CREATE INDEX llm_requests_userId_createdAt_idx ON llm_requests ("userId", "createdAt");
CREATE INDEX llm_requests_provider_model_createdAt_idx ON llm_requests (provider, model, "createdAt");
CREATE INDEX quota_events_userId_createdAt_idx ON quota_events ("userId", "createdAt");
