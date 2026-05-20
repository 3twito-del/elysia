CREATE TABLE "AiProviderUsage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "remainingRequests" INTEGER,
    "remainingTokens" INTEGER,
    "resetAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiProviderUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiProviderUsage_provider_model_createdAt_idx" ON "AiProviderUsage"("provider", "model", "createdAt");
CREATE INDEX "AiProviderUsage_purpose_status_createdAt_idx" ON "AiProviderUsage"("purpose", "status", "createdAt");
CREATE INDEX "AiProviderUsage_resetAt_idx" ON "AiProviderUsage"("resetAt");
