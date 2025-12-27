# Traceability Matrix (추적성 매트릭스)

> 이 문서는 모든 명세와 구현 간의 추적성을 관리합니다.
> 모든 변경사항은 즉시 이 매트릭스에 반영되어야 합니다.

---

## 상태 범례

| 상태 | 의미 |
|-----|------|
| ⏳ 대기 | 명세 작성 완료, 구현 대기 |
| 🚧 진행중 | 구현 진행 중 |
| 🧪 테스트중 | 구현 완료, 테스트 작성/실행 중 |
| ✅ 완료 | 구현 및 테스트 완료 |
| ❌ 실패 | 테스트 실패 또는 명세 불충족 |
| 🔄 변경필요 | 명세 변경으로 재작업 필요 |

---

## 기능별 통합 추적 (Backend + Frontend)

> **중요**: 각 기능은 백엔드와 프론트엔드가 함께 구현되어야 합니다.

### Feature Unit 1: System Foundation
| Spec | Type | 구현 파일 | 테스트 파일 | 상태 |
|------|------|----------|------------|------|
| [FEAT-001](./features/FEAT-001.md) | Backend | packages/*, package.json, turbo.json | - | ✅ 완료 |
| [UI-004](./ui/UI-004.md) | Frontend | packages/frontend/src/components/*, packages/frontend/src/contexts/*, packages/frontend/src/hooks/*, packages/frontend/src/lib/*, packages/frontend/src/app/* | packages/frontend/src/__tests__/* | ✅ 완료 |
| [DATA-001](./data/DATA-001.md) | Database | packages/backend/prisma/schema.prisma, packages/shared/src/types/*.ts | - | ✅ 완료 |
| [INFRA-001](./infra/INFRA-001.md) | Infra | .github/workflows/*.yml, packages/*/Dockerfile | e2e/tests/*.spec.ts | ✅ 완료 |

### Feature Unit 2: Execution Management
| Spec | Type | 구현 파일 | 테스트 파일 | 상태 |
|------|------|----------|------------|------|
| [FEAT-002](./features/FEAT-002.md) | Backend | - | - | ⏳ 대기 |
| [UI-001](./ui/UI-001.md) | Frontend | - | - | ⏳ 대기 |
| [API-001](./api/API-001.md) | API | - | - | ⏳ 대기 |
| [API-002](./api/API-002.md) | API | - | - | ⏳ 대기 |
| [API-004](./api/API-004.md) | API | - | - | ⏳ 대기 |

### Feature Unit 3: History & Statistics
| Spec | Type | 구현 파일 | 테스트 파일 | 상태 |
|------|------|----------|------------|------|
| [FEAT-003](./features/FEAT-003.md) | Backend | - | - | ⏳ 대기 |
| [UI-002](./ui/UI-002.md) | Frontend | - | - | ⏳ 대기 |
| [API-003](./api/API-003.md) | API | - | - | ⏳ 대기 |

### Feature Unit 4: Artifact Management
| Spec | Type | 구현 파일 | 테스트 파일 | 상태 |
|------|------|----------|------------|------|
| [FEAT-004](./features/FEAT-004.md) | Backend | - | - | ⏳ 대기 |
| [UI-003](./ui/UI-003.md) | Frontend | - | - | ⏳ 대기 |
| [API-005](./api/API-005.md) | API | - | - | ⏳ 대기 |

---

## 개별 명세 추적

### 기능 명세 (FEAT)

| Spec ID | 명세 제목 | 구현 파일 | 테스트 파일 | 상태 | 비고 |
|---------|----------|----------|------------|------|------|
| [FEAT-001](./features/FEAT-001.md) | System Architecture | packages/*, package.json, turbo.json | - | ✅ 완료 | 모노레포 구조 구현 및 빌드 검증 완료 |
| [FEAT-002](./features/FEAT-002.md) | Agent Execution Management | - | - | ⏳ 대기 | K8s Job 관리 기능, UI-001과 함께 구현 |
| [FEAT-003](./features/FEAT-003.md) | Execution History Management | - | - | ⏳ 대기 | PostgreSQL 히스토리 저장, UI-002와 함께 구현 |
| [FEAT-004](./features/FEAT-004.md) | Artifact Management | - | - | ⏳ 대기 | S3 아티팩트 관리, UI-003과 함께 구현 |

---

### UI 명세 (UI)

| Spec ID | 명세 제목 | 구현 파일 | 테스트 파일 | 상태 | 연관 Backend |
|---------|----------|----------|------------|------|-------------|
| [UI-001](./ui/UI-001.md) | Execution Management UI | - | - | ⏳ 대기 | FEAT-002, API-001/002/004 |
| [UI-002](./ui/UI-002.md) | History & Statistics UI | - | - | ⏳ 대기 | FEAT-003, API-003 |
| [UI-003](./ui/UI-003.md) | Artifact Management UI | - | - | ⏳ 대기 | FEAT-004, API-005 |
| [UI-004](./ui/UI-004.md) | Common Layout & Auth UI | packages/frontend/src/components/layout/*, packages/frontend/src/components/auth/*, packages/frontend/src/components/ui/*, packages/frontend/src/components/feedback/*, packages/frontend/src/contexts/*, packages/frontend/src/hooks/*, packages/frontend/src/lib/*, packages/frontend/src/app/login/*, packages/frontend/src/app/dashboard/*, packages/frontend/src/app/settings/* | packages/frontend/src/__tests__/* | ✅ 완료 | FEAT-001 |

---

### API 명세 (API)

| Spec ID | 명세 제목 | 구현 파일 | 테스트 파일 | 상태 | 비고 |
|---------|----------|----------|------------|------|------|
| [API-001](./api/API-001.md) | Create Execution | - | - | ⏳ 대기 | POST /api/v1/executions |
| [API-002](./api/API-002.md) | Get Execution | - | - | ⏳ 대기 | GET /api/v1/executions/{id} |
| [API-003](./api/API-003.md) | List Executions | - | - | ⏳ 대기 | GET /api/v1/executions |
| [API-004](./api/API-004.md) | Cancel Execution | - | - | ⏳ 대기 | POST /api/v1/executions/{id}/cancel |
| [API-005](./api/API-005.md) | Artifact Management APIs | - | - | ⏳ 대기 | 아티팩트 CRUD |

---

### 데이터 모델 (DATA)

| Spec ID | 명세 제목 | 구현 파일 | 테스트 파일 | 상태 | 비고 |
|---------|----------|----------|------------|------|------|
| [DATA-001](./data/DATA-001.md) | Database Schema & Data Models | packages/backend/prisma/schema.prisma, packages/shared/src/types/*.ts, packages/backend/src/dto/*.ts | - | ✅ 완료 | Prisma Schema, TypeScript 타입, DTO 구현 완료 |

---

### 인프라 명세 (INFRA)

| Spec ID | 명세 제목 | 구현 파일 | 테스트 파일 | 상태 | 비고 |
|---------|----------|----------|------------|------|------|
| [INFRA-001](./infra/INFRA-001.md) | GitHub Actions CI/CD Strategy | .github/workflows/*.yml, packages/*/Dockerfile, e2e/* | e2e/tests/*.spec.ts | ✅ 완료 | CI, Integration, Docker, E2E 구현 완료 |

---

## 의존성 그래프

```
FEAT-001 (System Architecture) + UI-004 (Common Layout)
    │
    ├──▶ DATA-001 (Database Schema)
    │
    └──▶ Feature Unit 2: Execution Management
             │
             ├──▶ FEAT-002 (Agent Execution) ◀──▶ UI-001 (Execution UI)
             │        │
             │        ├──▶ API-001 (Create Execution)
             │        ├──▶ API-002 (Get Execution)
             │        └──▶ API-004 (Cancel Execution)
             │
             ├──▶ Feature Unit 3: History & Statistics
             │        │
             │        ├──▶ FEAT-003 (History Management) ◀──▶ UI-002 (History UI)
             │        │        │
             │        │        └──▶ API-003 (List Executions)
             │        │
             │        └──▶ Statistics Dashboard
             │
             └──▶ Feature Unit 4: Artifact Management
                      │
                      ├──▶ FEAT-004 (Artifact Management) ◀──▶ UI-003 (Artifact UI)
                      │        │
                      │        └──▶ API-005 (Artifact APIs)
                      │
                      └──▶ S3 Integration
```

---

## 통계 요약

| 카테고리 | 전체 | 완료 | 진행중 | 대기 | 완료율 |
|---------|-----|-----|-------|-----|--------|
| FEAT | 4 | 1 | 0 | 3 | 25% |
| UI | 4 | 1 | 0 | 3 | 25% |
| API | 5 | 0 | 0 | 5 | 0% |
| DATA | 1 | 1 | 0 | 0 | 100% |
| INFRA | 1 | 1 | 0 | 0 | 100% |
| **총계** | **15** | **4** | **0** | **11** | **27%** |

---

## 구현 우선순위

### Phase 1: Foundation (완료)
1. ✅ FEAT-001: 모노레포 구조 설정
2. ✅ DATA-001: 데이터베이스 스키마 생성
3. ✅ INFRA-001: CI/CD 파이프라인 구축
4. ✅ UI-004: 공통 레이아웃, 인증 UI

### Phase 2: Core Features (Backend + Frontend 동시 구현)

#### Sprint 2-1: Execution Management
| Backend | Frontend | Priority |
|---------|----------|----------|
| FEAT-002: Agent 실행 관리 | UI-001: 실행 관리 UI | P0 |
| API-001: 실행 생성 | 실행 생성 폼 | P0 |
| API-002: 실행 조회 | 실행 상세 페이지 | P0 |
| API-004: 실행 취소 | 취소 버튼 | P1 |

#### Sprint 2-2: History & Statistics
| Backend | Frontend | Priority |
|---------|----------|----------|
| FEAT-003: 히스토리 관리 | UI-002: 히스토리 UI | P0 |
| API-003: 목록 조회 | 히스토리 테이블 | P0 |
| 통계 API | 대시보드 차트 | P1 |

#### Sprint 2-3: Artifact Management
| Backend | Frontend | Priority |
|---------|----------|----------|
| FEAT-004: 아티팩트 관리 | UI-003: 아티팩트 UI | P0 |
| API-005: 아티팩트 API | 파일 뷰어/다운로드 | P0 |

---

## 변경 이력

| 날짜 | Spec ID | 변경 내용 | 작성자 |
|-----|---------|----------|-------|
| 2025-12-26 | - | 초기 생성 | System |
| 2025-12-26 | FEAT-001~004 | 기능 명세 추가 | System |
| 2025-12-26 | API-001~005 | API 명세 추가 | System |
| 2025-12-26 | DATA-001 | 데이터 모델 명세 추가 | System |
| 2025-12-27 | INFRA-001 | GitHub Actions CI/CD 전략 명세 추가 | Claude |
| 2025-12-27 | FEAT-001 | 모노레포 구조 구현 (pnpm workspace, shared, backend, frontend) | Claude |
| 2025-12-27 | INFRA-001 | 기본 CI 워크플로우 추가 | Claude |
| 2025-12-27 | DATA-001 | Prisma Schema, TypeScript 타입, DTO 구현 완료 | Claude |
| 2025-12-27 | INFRA-001 | CI 워크플로우 강화, Integration 워크플로우, Docker, E2E 구현 | Claude |
| 2025-12-27 | UI-001~004 | 프론트엔드 UI 명세 추가 (기능별 Backend-Frontend 연결) | Claude |
| 2025-12-27 | - | 기능별 통합 추적 섹션 추가, 구현 우선순위 재구성 | Claude |
| 2025-12-27 | UI-004 | 공통 레이아웃 및 인증 UI 구현 완료 (Tailwind CSS, 레이아웃 컴포넌트, 인증 컴포넌트, Toast, 다크모드) | Claude |
| 2025-12-27 | UI-004 | 프론트엔드 테스트 추가 (Jest, React Testing Library, UI/Auth 컴포넌트 테스트) | Claude |
