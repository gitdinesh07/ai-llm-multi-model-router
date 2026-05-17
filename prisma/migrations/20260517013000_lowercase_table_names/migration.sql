ALTER TABLE "User" RENAME TO users;
ALTER TABLE "ApiKey" RENAME TO api_keys;
ALTER TABLE "ProviderModel" RENAME TO provider_models;
ALTER TABLE "UserModelAccess" RENAME TO user_model_access;
ALTER TABLE "UsageBudget" RENAME TO usage_budgets;
ALTER TABLE "LlmRequest" RENAME TO llm_requests;
ALTER TABLE "QuotaEvent" RENAME TO quota_events;

ALTER SEQUENCE IF EXISTS "User_id_seq" RENAME TO users_id_seq;

ALTER INDEX IF EXISTS "User_email_key" RENAME TO users_email_key;
ALTER INDEX IF EXISTS "ApiKey_userId_status_idx" RENAME TO api_keys_userId_status_idx;
ALTER INDEX IF EXISTS "ProviderModel_provider_model_key" RENAME TO provider_models_provider_model_key;
ALTER INDEX IF EXISTS "UserModelAccess_userId_providerModelId_key" RENAME TO user_model_access_userId_providerModelId_key;
ALTER INDEX IF EXISTS "UsageBudget_userId_key" RENAME TO usage_budgets_userId_key;
ALTER INDEX IF EXISTS "LlmRequest_requestId_key" RENAME TO llm_requests_requestId_key;
ALTER INDEX IF EXISTS "LlmRequest_userId_createdAt_idx" RENAME TO llm_requests_userId_createdAt_idx;
ALTER INDEX IF EXISTS "LlmRequest_provider_model_createdAt_idx" RENAME TO llm_requests_provider_model_createdAt_idx;
ALTER INDEX IF EXISTS "QuotaEvent_userId_createdAt_idx" RENAME TO quota_events_userId_createdAt_idx;
