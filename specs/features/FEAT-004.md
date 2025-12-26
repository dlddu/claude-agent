# FEAT-004: Artifact Management

## Metadata
- **ID**: FEAT-004
- **Created**: 2025-12-26
- **Status**: Approved
- **Priority**: High

## Overview
Claude Agent가 생성한 아티팩트(파일, 코드, 이미지 등)를 AWS S3에 업로드하고 관리하는 기능을 정의합니다.

## Requirements

### REQ-1: Artifact Upload
- [ ] Agent Job에서 생성된 파일을 S3에 업로드
- [ ] 업로드 시 메타데이터 포함 (실행 ID, 파일 타입 등)
- [ ] 멀티파트 업로드 지원 (대용량 파일)
- [ ] 업로드 진행률 추적

### REQ-2: Artifact Storage Structure
```
s3://{bucket-name}/
├── artifacts/
│   └── {execution-id}/
│       ├── metadata.json        # 아티팩트 메타정보
│       ├── output/              # Agent 출력 파일
│       │   ├── file1.txt
│       │   └── file2.py
│       └── logs/                # 실행 로그
│           └── agent.log
```

### REQ-3: Artifact Metadata
```typescript
interface ArtifactMetadata {
  id: string;                     // 아티팩트 ID (UUID)
  executionId: string;            // 연관 실행 ID
  fileName: string;               // 원본 파일명
  filePath: string;               // S3 경로
  fileSize: number;               // 파일 크기 (bytes)
  mimeType: string;               // MIME 타입
  checksum: string;               // SHA-256 해시

  createdAt: Date;                // 생성 시간
  expiresAt?: Date;               // 만료 시간 (선택)

  tags?: Record<string, string>;  // 사용자 태그
}
```

### REQ-4: Artifact Download
- [ ] Presigned URL 생성 (시간 제한)
- [ ] 직접 다운로드 API (프록시)
- [ ] 스트리밍 다운로드 지원
- [ ] 다운로드 권한 검증

### REQ-5: Artifact Lifecycle
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ UPLOADING│────▶│  ACTIVE  │────▶│ ARCHIVED │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ DELETED  │
               └──────────┘
```

| State | Description |
|-------|-------------|
| UPLOADING | 업로드 진행 중 |
| ACTIVE | 활성 상태, 다운로드 가능 |
| ARCHIVED | 아카이브됨 (Glacier 등으로 이동) |
| DELETED | 삭제됨 |

### REQ-6: Retention & Cleanup
- [ ] 기본 보존 기간: 30일
- [ ] 실행별 보존 기간 설정 가능
- [ ] 만료된 아티팩트 자동 삭제 (S3 Lifecycle)
- [ ] 수동 삭제 API 제공
- [ ] 삭제 전 영구 보존 옵션

### REQ-7: Storage Tiers
| Tier | Use Case | S3 Class |
|------|----------|----------|
| HOT | 최근 생성, 자주 접근 | S3 Standard |
| WARM | 30일 이상, 가끔 접근 | S3 Standard-IA |
| COLD | 90일 이상, 거의 접근 없음 | S3 Glacier |

### REQ-8: Artifact Types
```typescript
enum ArtifactType {
  CODE = 'code',           // 소스 코드 파일
  DOCUMENT = 'document',   // 문서 (md, txt, pdf)
  IMAGE = 'image',         // 이미지
  DATA = 'data',           // 데이터 파일 (json, csv)
  LOG = 'log',             // 로그 파일
  OTHER = 'other'          // 기타
}
```

## Interface

### Service Interface
```typescript
interface ArtifactService {
  // Upload
  uploadArtifact(
    executionId: string,
    file: Buffer | ReadableStream,
    options: UploadOptions
  ): Promise<ArtifactMetadata>;

  // Download
  getPresignedUrl(artifactId: string, expiresIn?: number): Promise<string>;
  downloadArtifact(artifactId: string): Promise<ReadableStream>;

  // Query
  getArtifact(artifactId: string): Promise<ArtifactMetadata>;
  listArtifacts(executionId: string): Promise<ArtifactMetadata[]>;

  // Management
  deleteArtifact(artifactId: string): Promise<void>;
  deleteExecutionArtifacts(executionId: string): Promise<number>;

  // Lifecycle
  archiveArtifact(artifactId: string): Promise<void>;
  restoreArtifact(artifactId: string): Promise<void>;
}

interface UploadOptions {
  fileName: string;
  mimeType?: string;
  type?: ArtifactType;
  tags?: Record<string, string>;
  retentionDays?: number;
}
```

## S3 Configuration

### Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAgentAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{account}:role/claude-agent-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::{bucket-name}",
        "arn:aws:s3:::{bucket-name}/*"
      ]
    }
  ]
}
```

### Lifecycle Rules
```json
{
  "Rules": [
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Prefix": "artifacts/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    },
    {
      "ID": "TransitionToGlacier",
      "Status": "Enabled",
      "Prefix": "artifacts/",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "ID": "ExpireOldArtifacts",
      "Status": "Enabled",
      "Prefix": "artifacts/",
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

## Database Schema (Artifact Reference)

```sql
-- Artifacts metadata table (for fast querying)
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,

  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  checksum VARCHAR(64),

  type VARCHAR(20) DEFAULT 'other',
  status VARCHAR(20) DEFAULT 'ACTIVE',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,

  tags JSONB
);

CREATE INDEX idx_artifacts_execution_id ON artifacts(execution_id);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE INDEX idx_artifacts_expires_at ON artifacts(expires_at);
```

## Constraints

- S3 버킷은 사전에 생성되어 있어야 함
- 적절한 IAM 권한 필요
- 단일 파일 최대 크기: 5GB
- 버킷 버전닝 활성화 권장 (실수 복구)
- CORS 설정 필요 (프론트엔드 직접 업로드 시)

## Verification Criteria

- [ ] 파일 업로드가 정상 동작함
- [ ] Presigned URL 생성 및 다운로드 가능
- [ ] 파일 메타데이터가 DB에 저장됨
- [ ] 실행 ID로 아티팩트 목록 조회 가능
- [ ] 파일 삭제가 S3와 DB 모두에서 동작함
- [ ] Lifecycle 정책이 올바르게 적용됨

## Related Specs

- **Dependencies**: FEAT-001, FEAT-002
- **Related**: FEAT-003, API-004

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-26 | System | Initial creation |
