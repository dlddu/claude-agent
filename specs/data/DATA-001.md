# DATA-001: Database Schema & Data Models

## Metadata
- **ID**: DATA-001
- **Created**: 2025-12-26
- **Status**: Approved
- **Priority**: High

## Overview
Claude Agent Service의 전체 데이터베이스 스키마와 데이터 모델을 정의합니다.
PostgreSQL을 사용하며, Prisma ORM을 통해 관리합니다.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│   executions    │───────│  status_transitions │
│                 │  1:N  │                     │
└────────┬────────┘       └─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    artifacts    │
└─────────────────┘
```

## Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Enums
// ============================================

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum ArtifactStatus {
  UPLOADING
  ACTIVE
  ARCHIVED
  DELETED
}

enum ArtifactType {
  CODE
  DOCUMENT
  IMAGE
  DATA
  LOG
  OTHER
}

// ============================================
// Models
// ============================================

/// 실행 기록
model Execution {
  id          String   @id @default(uuid()) @db.Uuid

  // Request
  prompt      String   @db.Text
  model       String   @default("claude-sonnet-4-20250514") @db.VarChar(100)
  maxTokens   Int      @default(4096) @map("max_tokens")
  metadata    Json?    @db.JsonB

  // Execution Info
  status      ExecutionStatus @default(PENDING)
  jobName     String   @map("job_name") @db.VarChar(255)
  podName     String?  @map("pod_name") @db.VarChar(255)

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  startedAt   DateTime? @map("started_at") @db.Timestamptz
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // Result
  output       String?  @db.Text
  tokensUsed   Int?     @map("tokens_used")
  inputTokens  Int?     @map("input_tokens")
  outputTokens Int?     @map("output_tokens")

  // Error
  errorCode    String?  @map("error_code") @db.VarChar(100)
  errorMessage String?  @map("error_message") @db.Text
  errorDetails Json?    @map("error_details") @db.JsonB

  // Cost
  estimatedCost Decimal? @map("estimated_cost") @db.Decimal(10, 6)

  // Retention
  retainUntil  DateTime? @map("retain_until") @db.Timestamptz
  isPermanent  Boolean   @default(false) @map("is_permanent")

  // Relations
  statusTransitions StatusTransition[]
  artifacts         Artifact[]

  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@index([jobName])
  @@map("executions")
}

/// 상태 전환 이력
model StatusTransition {
  id             String    @id @default(uuid()) @db.Uuid
  executionId    String    @map("execution_id") @db.Uuid
  fromStatus     ExecutionStatus? @map("from_status")
  toStatus       ExecutionStatus  @map("to_status")
  transitionedAt DateTime  @default(now()) @map("transitioned_at") @db.Timestamptz
  reason         String?   @db.Text

  // Relations
  execution      Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@index([executionId])
  @@map("status_transitions")
}

/// 아티팩트
model Artifact {
  id          String   @id @default(uuid()) @db.Uuid
  executionId String   @map("execution_id") @db.Uuid

  // File Info
  fileName    String   @map("file_name") @db.VarChar(255)
  filePath    String   @map("file_path") @db.VarChar(1024)
  fileSize    BigInt   @map("file_size")
  mimeType    String?  @map("mime_type") @db.VarChar(100)
  checksum    String?  @db.VarChar(64)

  // Classification
  type        ArtifactType @default(OTHER)
  status      ArtifactStatus @default(ACTIVE)

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  expiresAt   DateTime? @map("expires_at") @db.Timestamptz
  archivedAt  DateTime? @map("archived_at") @db.Timestamptz

  // Metadata
  tags        Json?    @db.JsonB

  // Relations
  execution   Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@index([executionId])
  @@index([status])
  @@index([expiresAt])
  @@map("artifacts")
}
```

## TypeScript Types

```typescript
// types/execution.ts

export interface Execution {
  id: string;
  prompt: string;
  model: string;
  maxTokens: number;
  metadata?: Record<string, unknown>;

  status: ExecutionStatus;
  jobName: string;
  podName?: string;

  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  updatedAt: Date;

  output?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;

  errorCode?: string;
  errorMessage?: string;
  errorDetails?: unknown;

  estimatedCost?: number;
  retainUntil?: Date;
  isPermanent: boolean;

  statusTransitions?: StatusTransition[];
  artifacts?: Artifact[];
}

export type ExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// types/status-transition.ts

export interface StatusTransition {
  id: string;
  executionId: string;
  fromStatus?: ExecutionStatus;
  toStatus: ExecutionStatus;
  transitionedAt: Date;
  reason?: string;
}

// types/artifact.ts

export interface Artifact {
  id: string;
  executionId: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType?: string;
  checksum?: string;
  type: ArtifactType;
  status: ArtifactStatus;
  createdAt: Date;
  expiresAt?: Date;
  archivedAt?: Date;
  tags?: Record<string, string>;
}

export type ArtifactType =
  | 'CODE'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'DATA'
  | 'LOG'
  | 'OTHER';

export type ArtifactStatus =
  | 'UPLOADING'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DELETED';
```

## DTO (Data Transfer Objects)

```typescript
// dto/execution.dto.ts

export interface CreateExecutionDto {
  prompt: string;
  model?: string;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
  timeout?: number;
  callbackUrl?: string;
  resources?: ResourceConfig;
}

export interface UpdateExecutionDto {
  status?: ExecutionStatus;
  podName?: string;
  output?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: unknown;
}

export interface ExecutionFilterDto {
  status?: ExecutionStatus | ExecutionStatus[];
  createdAfter?: Date;
  createdBefore?: Date;
  model?: string;
  hasArtifacts?: boolean;
  search?: string;
}

export interface PaginationDto {
  page?: number;       // default: 1
  pageSize?: number;   // default: 20, max: 100
  sortBy?: 'createdAt' | 'completedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// dto/artifact.dto.ts

export interface CreateArtifactDto {
  executionId: string;
  fileName: string;
  filePath: string;
  fileSize: bigint;
  mimeType?: string;
  checksum?: string;
  type?: ArtifactType;
  tags?: Record<string, string>;
  retentionDays?: number;
}
```

## Database Migrations

```sql
-- migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE execution_status AS ENUM (
  'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
);

CREATE TYPE artifact_status AS ENUM (
  'UPLOADING', 'ACTIVE', 'ARCHIVED', 'DELETED'
);

CREATE TYPE artifact_type AS ENUM (
  'CODE', 'DOCUMENT', 'IMAGE', 'DATA', 'LOG', 'OTHER'
);

-- Create executions table
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  model VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  metadata JSONB,

  status execution_status NOT NULL DEFAULT 'PENDING',
  job_name VARCHAR(255) NOT NULL,
  pod_name VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  output TEXT,
  tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,

  error_code VARCHAR(100),
  error_message TEXT,
  error_details JSONB,

  estimated_cost DECIMAL(10, 6),
  retain_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);
CREATE INDEX idx_executions_job_name ON executions(job_name);

-- Create status_transitions table
CREATE TABLE status_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  from_status execution_status,
  to_status execution_status NOT NULL,
  transitioned_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX idx_status_transitions_execution_id ON status_transitions(execution_id);

-- Create artifacts table
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,

  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  checksum VARCHAR(64),

  type artifact_type DEFAULT 'OTHER',
  status artifact_status DEFAULT 'ACTIVE',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  tags JSONB
);

CREATE INDEX idx_artifacts_execution_id ON artifacts(execution_id);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE INDEX idx_artifacts_expires_at ON artifacts(expires_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_executions_updated_at
  BEFORE UPDATE ON executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Constraints

- 모든 테이블에 UUID 사용
- TIMESTAMPTZ로 타임존 지원
- JSONB로 유연한 메타데이터 저장
- 적절한 인덱스로 쿼리 성능 보장
- CASCADE 삭제로 참조 무결성 유지

## Verification Criteria

- [ ] Prisma 마이그레이션이 정상 실행됨
- [ ] 모든 테이블이 올바르게 생성됨
- [ ] 인덱스가 올바르게 적용됨
- [ ] 외래 키 제약조건이 동작함
- [ ] Prisma Client 타입이 올바르게 생성됨

## Related Specs

- **Dependencies**: FEAT-001
- **Related**: FEAT-002, FEAT-003, FEAT-004

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-26 | System | Initial creation |
