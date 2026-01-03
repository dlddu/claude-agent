-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM ('UPLOADING', 'ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('CODE', 'DOCUMENT', 'IMAGE', 'DATA', 'LOG', 'OTHER');

-- CreateTable
CREATE TABLE "executions" (
    "id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "metadata" JSONB,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "job_name" VARCHAR(255) NOT NULL,
    "pod_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "output" TEXT,
    "tokens_used" INTEGER,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "error_details" JSONB,
    "estimated_cost" DECIMAL(10,6),
    "retain_until" TIMESTAMPTZ,
    "is_permanent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_transitions" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "from_status" "ExecutionStatus",
    "to_status" "ExecutionStatus" NOT NULL,
    "transitioned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "status_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(1024) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100),
    "checksum" VARCHAR(64),
    "type" "ArtifactType" NOT NULL DEFAULT 'OTHER',
    "status" "ArtifactStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "tags" JSONB,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "executions_status_idx" ON "executions"("status");

-- CreateIndex
CREATE INDEX "executions_created_at_idx" ON "executions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "executions_job_name_idx" ON "executions"("job_name");

-- CreateIndex
CREATE INDEX "status_transitions_execution_id_idx" ON "status_transitions"("execution_id");

-- CreateIndex
CREATE INDEX "artifacts_execution_id_idx" ON "artifacts"("execution_id");

-- CreateIndex
CREATE INDEX "artifacts_status_idx" ON "artifacts"("status");

-- CreateIndex
CREATE INDEX "artifacts_expires_at_idx" ON "artifacts"("expires_at");

-- AddForeignKey
ALTER TABLE "status_transitions" ADD CONSTRAINT "status_transitions_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
