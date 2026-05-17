-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUCCESS', 'FAILED', 'DENIED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderModel" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModelAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "providerModelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserModelAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageBudget" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY',
    "tokenLimit" INTEGER NOT NULL,
    "consumedTokens" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "requestId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ApiKey_userId_status_idx" ON "ApiKey"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderModel_provider_model_key" ON "ProviderModel"("provider", "model");

-- CreateIndex
CREATE UNIQUE INDEX "UserModelAccess_userId_providerModelId_key" ON "UserModelAccess"("userId", "providerModelId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageBudget_userId_key" ON "UsageBudget"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LlmRequest_requestId_key" ON "LlmRequest"("requestId");

-- CreateIndex
CREATE INDEX "LlmRequest_userId_createdAt_idx" ON "LlmRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LlmRequest_provider_model_createdAt_idx" ON "LlmRequest"("provider", "model", "createdAt");

-- CreateIndex
CREATE INDEX "QuotaEvent_userId_createdAt_idx" ON "QuotaEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModelAccess" ADD CONSTRAINT "UserModelAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModelAccess" ADD CONSTRAINT "UserModelAccess_providerModelId_fkey" FOREIGN KEY ("providerModelId") REFERENCES "ProviderModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageBudget" ADD CONSTRAINT "UsageBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmRequest" ADD CONSTRAINT "LlmRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaEvent" ADD CONSTRAINT "QuotaEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
