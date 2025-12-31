# FEAT-001: Claude Agent Service - System Architecture

## Metadata
- **ID**: FEAT-001
- **Created**: 2025-12-26
- **Status**: Approved
- **Priority**: High

## Overview
쿠버네티스 환경에서 Claude Agent를 실행하고 관리하는 서비스의 전체 시스템 아키텍처를 정의합니다.
프론트엔드와 백엔드를 모노레포로 구성하며, 외부 요청에 따라 Agent를 K8s Job으로 실행합니다.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Kubernetes Cluster                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐    │
│  │   Frontend   │────▶│   Backend    │────▶│  Claude Agent    │    │
│  │   (Next.js)  │     │   (NestJS)   │     │   (K8s Job)      │    │
│  │              │     │              │     │                  │    │
│  └──────────────┘     └──────┬───────┘     └────────┬─────────┘    │
│                              │                       │              │
│                              ▼                       │              │
│                    ┌──────────────────┐              │              │
│                    │   PostgreSQL     │◀─────────────┘              │
│                    │   (History DB)   │                             │
│                    └──────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │      AWS S3      │
                    │   (Artifacts)    │
                    └──────────────────┘
```

## Requirements

### REQ-1: Monorepo Structure
- [x] 프론트엔드와 백엔드를 단일 레포지토리에서 관리
- [x] 패키지 매니저로 pnpm workspace 사용
- [x] 공통 타입, 유틸리티를 shared 패키지로 분리

### REQ-2: Kubernetes Environment
- [x] 모든 서비스는 K8s에서 실행 (k8s/base/*.yaml)
- [x] Frontend, Backend는 Deployment로 배포 (k8s/base/*-deployment.yaml)
- [x] Agent는 K8s Job으로 실행 (K8sService, agent-job-template.yaml)
- [x] ConfigMap과 Secret을 통한 설정 관리 (k8s/base/configmap.yaml, secret.yaml)

### REQ-3: Service Communication
- [x] Frontend → Backend: REST API (HTTP/HTTPS) (packages/frontend/src/lib/api.ts)
- [x] Backend → K8s API: Service Account 기반 인증 (packages/backend/src/k8s/k8s.service.ts)
- [x] Backend → PostgreSQL: Connection Pool (packages/backend/src/prisma/prisma.service.ts)
- [x] Agent Job → S3: AWS SDK (packages/backend/src/s3/s3.service.ts)

### REQ-4: Security
- [x] API 인증을 위한 JWT 또는 API Key 지원 (packages/backend/src/auth/)
- [x] K8s RBAC을 통한 권한 관리 (k8s/base/rbac.yaml)
- [x] Secret 관리를 위한 K8s Secret 활용 (k8s/base/secret.yaml)
- [x] S3 접근을 위한 IAM Role 또는 Access Key (S3Service with AWS credentials)

## Directory Structure

```
claude-agent/
├── packages/
│   ├── frontend/          # Next.js Frontend
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   ├── backend/           # NestJS Backend
│   │   ├── src/
│   │   └── package.json
│   └── shared/            # Shared types & utilities
│       ├── src/
│       └── package.json
├── k8s/                   # Kubernetes manifests
│   ├── base/
│   └── overlays/
├── docker/                # Dockerfiles
├── specs/                 # Specifications
├── tests/                 # E2E tests
├── package.json           # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml
└── turbo.json             # Turborepo config
```

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 14.x |
| Backend | NestJS | 10.x |
| Database | PostgreSQL | 15.x |
| ORM | Prisma | 5.x |
| Container | Docker | 24.x |
| Orchestration | Kubernetes | 1.28+ |
| Storage | AWS S3 | - |
| Package Manager | pnpm | 8.x |
| Build System | Turborepo | 2.x |
| Language | TypeScript | 5.x |

## Constraints

- K8s 클러스터 버전 1.28 이상 필요
- S3 버킷에 대한 적절한 IAM 권한 필요
- PostgreSQL은 클러스터 내부 또는 외부(RDS) 모두 지원
- Agent Job 실행을 위한 충분한 클러스터 리소스 필요

## Verification Criteria

- [x] 모노레포 구조가 올바르게 설정됨 (pnpm-workspace.yaml, packages/*)
- [x] pnpm workspace가 정상 동작함 (CI 빌드 통과)
- [x] 모든 서비스가 K8s에 배포 가능함 (k8s/base/, Kind 통합 테스트)
- [x] Frontend에서 Backend API 호출이 정상 동작함 (packages/frontend/src/lib/api.ts)
- [x] Backend에서 K8s Job 생성이 가능함 (K8sService 구현)
- [x] PostgreSQL 연결이 정상 동작함 (PrismaService, 통합 테스트)
- [x] S3 업로드/다운로드가 정상 동작함 (S3Service, LocalStack 통합 테스트)

## Related Specs

- **Dependencies**: None (Root specification)
- **Related**: FEAT-002, FEAT-003, FEAT-004, DATA-001

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-26 | System | Initial creation |
| 2025-12-29 | Claude | REQ-2 구현: K8s manifests 생성 (Namespace, ConfigMap, Secret, Deployments, Services, RBAC, Job Template) |
| 2025-12-29 | Claude | REQ-3 구현: K8sService (@kubernetes/client-node), S3Service (@aws-sdk/client-s3) |
| 2025-12-29 | Claude | REQ-4 구현: AuthModule (JWT, API Key, Passport), RBAC manifests |
| 2025-12-29 | Claude | CI 강화: kubeconform 검증, Kind 클러스터 테스트, LocalStack S3 테스트 |
