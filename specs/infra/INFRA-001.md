# INFRA-001: GitHub Actions CI/CD Strategy

## Metadata
- **ID**: INFRA-001
- **Created**: 2025-12-27
- **Status**: Approved
- **Priority**: High

## Overview
Claude Agent Service 프로젝트의 GitHub Actions 기반 CI/CD 파이프라인 전략을 정의합니다.
모노레포 구조(pnpm + Turborepo)에 최적화된 워크플로우를 구성합니다.

## CI/CD Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Actions Workflows                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PR/Push                                                                     │
│    │                                                                         │
│    ▼                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │    CI        │───▶│  Integration │───▶│   Docker     │                   │
│  │  (ci.yml)    │    │  (int.yml)   │    │ (docker.yml) │                   │
│  │              │    │              │    │              │                   │
│  │ - Lint       │    │ - DB Tests   │    │ - Build      │                   │
│  │ - Type Check │    │ - E2E Tests  │    │ - Push       │                   │
│  │ - Unit Tests │    │              │    │ - Scan       │                   │
│  │ - Build      │    │              │    │              │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                                              │
│  Tag/Release                                                                 │
│    │                                                                         │
│    ▼                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                      Release (release.yml)                        │       │
│  │  - Changelog generation                                           │       │
│  │  - Production Docker images                                       │       │
│  │  - GitHub Release                                                 │       │
│  │  - K8s manifest update                                           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Requirements

### REQ-1: Core CI Pipeline (ci.yml)
- [x] PR 생성/업데이트 시 자동 실행
- [x] main 브랜치 push 시 실행
- [x] 변경된 패키지만 선택적으로 빌드 (Turborepo 활용)
- [x] 병렬 실행으로 속도 최적화

### REQ-2: Integration Testing (integration.yml)
- [x] PostgreSQL 서비스 컨테이너 사용
- [x] Prisma 마이그레이션 테스트
- [x] API 통합 테스트 실행
- [x] E2E 테스트 실행 (선택적)

### REQ-3: Docker Build (docker.yml)
- [x] 멀티 스테이지 빌드
- [x] 빌드 캐시 활용 (GitHub Actions Cache)
- [x] 보안 스캔 (Trivy)
- [x] 이미지 태깅 전략 (semver, sha, latest)

### REQ-4: Release Pipeline (release.yml)
- [ ] 시맨틱 버저닝
- [ ] 자동 Changelog 생성
- [ ] Production 이미지 빌드 및 푸시
- [ ] GitHub Release 생성

### REQ-5: Quality Gates
- [ ] 코드 커버리지 임계값 (80% 이상)
- [ ] 보안 취약점 체크 (Critical/High 차단)
- [ ] 의존성 감사 (npm audit)
- [ ] 라이선스 체크

---

## Workflow Specifications

### 1. CI Workflow (ci.yml)

**Trigger:**
```yaml
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
```

**Jobs:**

| Job | Description | Runs On | Dependencies |
|-----|-------------|---------|--------------|
| detect-changes | 변경된 패키지 감지 | ubuntu-latest | - |
| lint | ESLint + Prettier | ubuntu-latest | detect-changes |
| typecheck | TypeScript 타입 체크 | ubuntu-latest | detect-changes |
| unit-test | Jest 유닛 테스트 | ubuntu-latest | detect-changes |
| build | Turborepo 빌드 | ubuntu-latest | lint, typecheck |

**Cache Strategy:**
```yaml
- pnpm store (~/.pnpm-store)
- Turborepo cache (.turbo)
- Next.js cache (.next/cache)
```

**Matrix Strategy:**
```yaml
strategy:
  matrix:
    package: [frontend, backend, shared]
```

---

### 2. Integration Workflow (integration.yml)

**Trigger:**
```yaml
on:
  pull_request:
    branches: [main]
  workflow_dispatch:
```

**Services:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: claude_agent_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

**Jobs:**

| Job | Description | Dependencies |
|-----|-------------|--------------|
| db-migration | Prisma migrate deploy | - |
| integration-test | API 통합 테스트 | db-migration |
| e2e-test | Playwright E2E | integration-test |

---

### 3. Docker Workflow (docker.yml)

**Trigger:**
```yaml
on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]
```

**Image Tagging:**
```yaml
tags: |
  type=ref,event=branch
  type=ref,event=pr
  type=semver,pattern={{version}}
  type=semver,pattern={{major}}.{{minor}}
  type=sha
```

**Jobs:**

| Job | Description | Output |
|-----|-------------|--------|
| build-frontend | Frontend 이미지 빌드 | ghcr.io/*/frontend |
| build-backend | Backend 이미지 빌드 | ghcr.io/*/backend |
| build-agent | Agent 이미지 빌드 | ghcr.io/*/agent |
| security-scan | Trivy 취약점 스캔 | SARIF report |

**Build Arguments:**
```yaml
build-args: |
  NODE_ENV=production
  NEXT_TELEMETRY_DISABLED=1
```

---

### 4. Release Workflow (release.yml)

**Trigger:**
```yaml
on:
  push:
    tags: ['v*.*.*']
```

**Jobs:**

| Job | Description |
|-----|-------------|
| create-release | GitHub Release 생성 |
| publish-images | Production 이미지 푸시 |
| update-manifests | K8s manifest 버전 업데이트 |
| notify | Slack/Discord 알림 |

---

## Reusable Workflows

### setup-pnpm (공통 설정)
```yaml
# .github/workflows/setup-pnpm.yml
name: Setup pnpm
on:
  workflow_call:
    inputs:
      node-version:
        default: '20'
        type: string

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
```

---

## Environment & Secrets

### Required Secrets

| Secret | Description | Used In |
|--------|-------------|---------|
| GHCR_TOKEN | GitHub Container Registry | docker.yml |
| DATABASE_URL | PostgreSQL 연결 문자열 | integration.yml |
| AWS_ACCESS_KEY_ID | AWS 접근 키 | release.yml |
| AWS_SECRET_ACCESS_KEY | AWS 시크릿 키 | release.yml |
| SLACK_WEBHOOK_URL | Slack 알림 | release.yml |

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| NODE_ENV | test/production | 실행 환경 |
| CI | true | CI 환경 플래그 |
| TURBO_TEAM | claude-agent | Turborepo 팀 |
| TURBO_TOKEN | (secret) | Turborepo Remote Cache |

---

## Branch Protection Rules

### main branch
```yaml
- Require status checks:
  - CI / lint
  - CI / typecheck
  - CI / unit-test
  - CI / build
  - Integration / integration-test
  - Docker / security-scan
- Require PR reviews: 1
- Require up-to-date branches: true
- Restrict pushes: maintainers only
```

### develop branch
```yaml
- Require status checks:
  - CI / lint
  - CI / typecheck
  - CI / unit-test
- Require PR reviews: 1
```

---

## Performance Optimization

### 1. Turborepo Remote Cache
```yaml
- name: Setup Turborepo Remote Cache
  uses: actions/cache@v4
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 2. Dependency Caching
```yaml
- name: Cache pnpm store
  uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: pnpm-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      pnpm-${{ runner.os }}-
```

### 3. Docker Layer Caching
```yaml
- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 4. Affected Package Detection
```yaml
- name: Detect affected packages
  run: |
    pnpm turbo run build --filter='...[origin/main]' --dry-run=json
```

---

## Workflow Files Structure

```
.github/
├── workflows/
│   ├── ci.yml              # Core CI (lint, test, build)
│   ├── integration.yml     # Integration & E2E tests
│   ├── docker.yml          # Docker build & push
│   ├── release.yml         # Release automation
│   └── codeql.yml          # Security scanning
├── actions/
│   └── setup-pnpm/         # Composite action
│       └── action.yml
└── CODEOWNERS
```

---

## Estimated Execution Times

| Workflow | Estimated Time | Optimization |
|----------|---------------|--------------|
| CI (full) | ~5 min | Parallel jobs + cache |
| CI (cached) | ~2 min | Turborepo cache hit |
| Integration | ~8 min | DB startup overhead |
| Docker (full) | ~10 min | Multi-stage build |
| Docker (cached) | ~3 min | Layer cache |
| Release | ~15 min | All images + notify |

---

## Constraints

- GitHub-hosted runner 사용 (ubuntu-latest)
- GHCR (GitHub Container Registry) 사용
- Concurrency 설정으로 중복 워크플로우 방지
- 타임아웃: CI 20분, Integration 30분, Docker 30분

---

## Verification Criteria

- [ ] 모든 워크플로우 YAML 구문 검증
- [ ] PR 생성 시 CI 자동 실행
- [ ] 테스트 실패 시 PR 머지 차단
- [ ] Docker 이미지 성공적으로 빌드 및 푸시
- [ ] 태그 푸시 시 Release 자동 생성
- [ ] 캐시 히트율 80% 이상

---

## Related Specs

- **Dependencies**: FEAT-001 (System Architecture)
- **Related**: All FEAT, API, DATA specs

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-27 | Claude | Initial creation |
| 2025-12-27 | Claude | REQ-1, REQ-2 구현 완료 (ci.yml 강화, integration.yml 생성) |
| 2025-12-27 | Claude | REQ-3 구현 완료 (docker.yml, Dockerfile, E2E 테스트 인프라) |
