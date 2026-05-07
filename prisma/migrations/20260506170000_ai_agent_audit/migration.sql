-- Add audit tables for AI agent runs and tool calls.

CREATE TABLE "AiRun" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "AiRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiToolCall" (
    "id" TEXT NOT NULL,
    "aiRunId" TEXT NOT NULL,
    "toolCallId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "AiToolCall_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiRun_customerId_idx" ON "AiRun"("customerId");
CREATE INDEX "AiRun_kind_startedAt_idx" ON "AiRun"("kind", "startedAt");
CREATE INDEX "AiRun_status_startedAt_idx" ON "AiRun"("status", "startedAt");
CREATE INDEX "AiToolCall_aiRunId_idx" ON "AiToolCall"("aiRunId");
CREATE INDEX "AiToolCall_name_status_idx" ON "AiToolCall"("name", "status");

ALTER TABLE "AiRun" ADD CONSTRAINT "AiRun_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiToolCall" ADD CONSTRAINT "AiToolCall_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "AiRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
