# FEAT-002: Claude Agent Execution Management

## Metadata
- **ID**: FEAT-002
- **Created**: 2025-12-26
- **Status**: Approved
- **Priority**: High

## Overview
외부 요청에 따라 Claude Agent를 Kubernetes Job으로 생성, 실행, 모니터링, 종료하는 기능을 정의합니다.

## Requirements

### REQ-1: Agent Job Creation
- [ ] 외부 요청 수신 시 K8s Job 생성
- [ ] Job 이름은 고유한 ID로 생성 (예: `claude-agent-{uuid}`)
- [ ] Job 생성 시 필요한 환경변수 주입
  - `ANTHROPIC_API_KEY`: Claude API 키
  - `AGENT_TASK_ID`: 작업 식별자
  - `S3_BUCKET`: 아티팩트 저장 버킷
  - `CALLBACK_URL`: 완료 시 콜백 URL (선택)
- [ ] 리소스 제한 설정 (CPU, Memory)
- [ ] Job 타임아웃 설정

### REQ-2: Agent Job Specification
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: claude-agent-{uuid}
  namespace: claude-agent
  labels:
    app: claude-agent
    task-id: {task-id}
spec:
  ttlSecondsAfterFinished: 3600
  backoffLimit: 0
  activeDeadlineSeconds: 1800  # 30 minutes timeout
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: agent
        image: claude-agent:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: claude-agent-secrets
              key: anthropic-api-key
        - name: AGENT_TASK_ID
          value: "{task-id}"
        - name: S3_BUCKET
          value: "{bucket-name}"
```

### REQ-3: Job Lifecycle Management
- [ ] Job 상태 조회 (Pending, Running, Succeeded, Failed)
- [ ] Job 강제 종료 (삭제)
- [ ] Job 로그 조회
- [ ] Job 완료 시 자동 정리 (TTL 기반)

### REQ-4: Execution States

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│ PENDING │────▶│ RUNNING │────▶│ COMPLETED│
└─────────┘     └────┬────┘     └──────────┘
                     │
                     ▼
               ┌──────────┐
               │  FAILED  │
               └──────────┘
                     │
                     ▼
               ┌───────────┐
               │ CANCELLED │
               └───────────┘
```

| State | Description |
|-------|-------------|
| PENDING | Job 생성됨, Pod 스케줄링 대기 중 |
| RUNNING | Agent 실행 중 |
| COMPLETED | 정상 완료 |
| FAILED | 실행 중 오류 발생 |
| CANCELLED | 사용자에 의해 취소됨 |

### REQ-5: Execution Request Schema
```typescript
interface ExecutionRequest {
  // 필수 필드
  prompt: string;              // Agent에게 전달할 프롬프트

  // 선택 필드
  model?: string;              // Claude 모델 (기본: claude-sonnet-4-20250514)
  maxTokens?: number;          // 최대 토큰 수 (기본: 4096)
  timeout?: number;            // 타임아웃 초 (기본: 1800)
  callbackUrl?: string;        // 완료 시 콜백 URL
  metadata?: Record<string, string>;  // 사용자 정의 메타데이터

  // 리소스 설정
  resources?: {
    memoryRequest?: string;    // 예: "512Mi"
    memoryLimit?: string;      // 예: "2Gi"
    cpuRequest?: string;       // 예: "500m"
    cpuLimit?: string;         // 예: "2000m"
  };
}
```

### REQ-6: Execution Response Schema
```typescript
interface ExecutionResponse {
  id: string;                  // 실행 ID (UUID)
  status: ExecutionStatus;     // 현재 상태
  createdAt: string;           // 생성 시간 (ISO 8601)
  startedAt?: string;          // 시작 시간
  completedAt?: string;        // 완료 시간

  // Job 정보
  jobName: string;             // K8s Job 이름
  podName?: string;            // K8s Pod 이름

  // 결과 (완료 시)
  result?: {
    output: string;            // Agent 출력
    tokensUsed: number;        // 사용된 토큰 수
    artifacts?: ArtifactInfo[]; // 생성된 아티팩트 목록
  };

  // 에러 (실패 시)
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### REQ-7: Concurrent Execution Limits
- [ ] 동시 실행 가능한 최대 Job 수 설정 가능
- [ ] 사용자/테넌트별 동시 실행 제한
- [ ] 제한 초과 시 큐잉 또는 거부 처리

## Interface

### Service Interface
```typescript
interface AgentExecutionService {
  // Job 생성 및 실행
  createExecution(request: ExecutionRequest): Promise<ExecutionResponse>;

  // Job 상태 조회
  getExecution(id: string): Promise<ExecutionResponse>;

  // Job 목록 조회
  listExecutions(filter?: ExecutionFilter): Promise<ExecutionResponse[]>;

  // Job 취소
  cancelExecution(id: string): Promise<void>;

  // Job 로그 조회
  getExecutionLogs(id: string, options?: LogOptions): Promise<string>;
}
```

## Constraints

- K8s 클러스터에 Job 생성 권한이 있는 Service Account 필요
- Agent 이미지는 미리 빌드되어 레지스트리에 존재해야 함
- Anthropic API Key는 K8s Secret으로 관리
- 단일 Job의 최대 실행 시간은 1시간으로 제한

## Verification Criteria

- [ ] 요청 시 K8s Job이 정상적으로 생성됨
- [ ] Job 상태가 정확하게 추적됨
- [ ] Job 완료 시 결과가 올바르게 반환됨
- [ ] Job 취소가 정상 동작함
- [ ] 동시 실행 제한이 올바르게 적용됨
- [ ] Job 로그 조회가 정상 동작함

## Related Specs

- **Dependencies**: FEAT-001
- **Related**: FEAT-003, FEAT-004, API-001, API-002

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-26 | System | Initial creation |
