# FEAT-003: Execution History Management

## Metadata
- **ID**: FEAT-003
- **Created**: 2025-12-26
- **Status**: Approved
- **Priority**: High

## Overview
Claude Agent 실행 히스토리를 PostgreSQL에 저장하고 관리하는 기능을 정의합니다.
모든 실행 기록, 상태 변화, 결과를 추적하고 조회할 수 있습니다.

## Requirements

### REQ-1: History Data Storage
- [ ] 모든 실행 요청은 DB에 기록됨
- [ ] 실행 상태 변화 시 즉시 DB 업데이트
- [ ] 실행 결과 및 에러 정보 저장
- [ ] 사용된 토큰 및 비용 정보 저장

### REQ-2: Data Retention Policy
- [ ] 기본 보존 기간: 90일
- [ ] 보존 기간 설정 가능 (환경변수)
- [ ] 만료된 데이터 자동 삭제 (Batch Job)
- [ ] 중요 실행 기록은 영구 보존 옵션

### REQ-3: Query Capabilities
- [ ] 실행 ID로 단일 조회
- [ ] 상태별 필터링
- [ ] 날짜 범위 필터링
- [ ] 페이지네이션 지원
- [ ] 사용자/테넌트별 필터링
- [ ] 정렬 옵션 (생성일, 완료일, 상태)

### REQ-4: History Record Schema
```typescript
interface ExecutionHistory {
  // Primary Key
  id: string;                      // UUID

  // Request Information
  prompt: string;                  // 원본 프롬프트
  model: string;                   // 사용된 모델
  maxTokens: number;               // 설정된 최대 토큰
  metadata?: Record<string, string>; // 사용자 메타데이터

  // Execution Information
  status: ExecutionStatus;         // 현재 상태
  jobName: string;                 // K8s Job 이름
  podName?: string;                // K8s Pod 이름

  // Timestamps
  createdAt: Date;                 // 생성 시간
  startedAt?: Date;                // 실행 시작 시간
  completedAt?: Date;              // 완료 시간
  updatedAt: Date;                 // 마지막 업데이트

  // Result (on completion)
  output?: string;                 // Agent 출력
  tokensUsed?: number;             // 실제 사용 토큰
  inputTokens?: number;            // 입력 토큰
  outputTokens?: number;           // 출력 토큰

  // Error (on failure)
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: any;

  // Artifacts Reference
  artifacts?: string[];            // 아티팩트 ID 목록

  // Cost Tracking
  estimatedCost?: number;          // 추정 비용 (USD)

  // Retention
  retainUntil?: Date;              // 보존 기한
  isPermanent: boolean;            // 영구 보존 여부
}
```

### REQ-5: Status Transition Logging
```typescript
interface StatusTransition {
  id: string;                      // UUID
  executionId: string;             // FK to ExecutionHistory
  fromStatus?: ExecutionStatus;    // 이전 상태 (최초는 null)
  toStatus: ExecutionStatus;       // 새 상태
  transitionedAt: Date;            // 전환 시간
  reason?: string;                 // 전환 사유
}
```

### REQ-6: Statistics & Analytics
- [ ] 일/주/월별 실행 통계
- [ ] 성공/실패율
- [ ] 평균 실행 시간
- [ ] 토큰 사용량 통계
- [ ] 비용 통계

```typescript
interface ExecutionStatistics {
  period: string;                  // 기간 (daily, weekly, monthly)
  startDate: Date;
  endDate: Date;

  totalExecutions: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;

  avgExecutionTime: number;        // 초 단위
  totalTokensUsed: number;
  totalCost: number;
}
```

## Interface

### Repository Interface
```typescript
interface ExecutionHistoryRepository {
  // CRUD
  create(data: CreateExecutionInput): Promise<ExecutionHistory>;
  findById(id: string): Promise<ExecutionHistory | null>;
  update(id: string, data: UpdateExecutionInput): Promise<ExecutionHistory>;
  delete(id: string): Promise<void>;

  // Query
  findMany(filter: ExecutionFilter, pagination: PaginationInput): Promise<{
    data: ExecutionHistory[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  // Status
  updateStatus(id: string, status: ExecutionStatus, reason?: string): Promise<void>;
  getStatusHistory(executionId: string): Promise<StatusTransition[]>;

  // Statistics
  getStatistics(period: StatsPeriod, filter?: StatsFilter): Promise<ExecutionStatistics>;

  // Retention
  deleteExpired(): Promise<number>;
  markPermanent(id: string): Promise<void>;
}
```

### Filter Schema
```typescript
interface ExecutionFilter {
  status?: ExecutionStatus | ExecutionStatus[];
  createdAfter?: Date;
  createdBefore?: Date;
  model?: string;
  hasArtifacts?: boolean;
  search?: string;                 // 프롬프트 내용 검색
}

interface PaginationInput {
  page: number;                    // 1-based
  pageSize: number;                // default: 20, max: 100
  sortBy?: 'createdAt' | 'completedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

## Database Schema (PostgreSQL)

```sql
-- Executions table
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  model VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  max_tokens INTEGER NOT NULL DEFAULT 4096,
  metadata JSONB,

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  job_name VARCHAR(255) NOT NULL,
  pod_name VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  output TEXT,
  tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,

  error_code VARCHAR(100),
  error_message TEXT,
  error_details JSONB,

  artifacts TEXT[],
  estimated_cost DECIMAL(10, 6),

  retain_until TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_created_at ON executions(created_at DESC);
CREATE INDEX idx_executions_job_name ON executions(job_name);

-- Status transitions table
CREATE TABLE status_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX idx_status_transitions_execution_id ON status_transitions(execution_id);
```

## Constraints

- PostgreSQL 15.x 이상 권장
- 대용량 output 필드를 위해 TEXT 타입 사용
- 적절한 인덱스로 쿼리 성능 보장
- Connection Pool 사용 필수 (Prisma 기본 제공)

## Verification Criteria

- [ ] 실행 생성 시 DB 레코드가 생성됨
- [ ] 상태 변경 시 레코드가 업데이트됨
- [ ] 상태 전환 이력이 기록됨
- [ ] 필터링 및 페이지네이션이 정상 동작함
- [ ] 통계 조회가 정확한 값을 반환함
- [ ] 만료 데이터 삭제가 정상 동작함

## Related Specs

- **Dependencies**: FEAT-001, FEAT-002
- **Related**: DATA-001, API-003

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-26 | System | Initial creation |
