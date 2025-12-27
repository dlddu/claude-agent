# PLAN-DATA-001: Database Schema & Data Models 구현

## 메타데이터
- **ID**: PLAN-DATA-001
- **작성일**: 2025-12-27
- **관련 명세**: DATA-001
- **예상 파일 변경**: 10개+
- **상태**: 완료

## 목표
DATA-001 명세에 따라 Prisma ORM 기반 데이터베이스 스키마와 TypeScript 데이터 모델을 구현합니다.

## 작업 분할

### 1단계: Prisma 설정
- [x] Prisma 패키지 설치 (backend)
- [x] prisma/schema.prisma 생성
- [x] .env.example 추가 (DATABASE_URL 템플릿)

**예상 변경 파일:**
- `packages/backend/package.json` - Prisma 의존성 추가
- `packages/backend/prisma/schema.prisma` - Prisma 스키마
- `packages/backend/.env.example` - 환경변수 템플릿

### 2단계: TypeScript 타입 정의 (shared)
- [x] Execution 관련 타입 정의
- [x] StatusTransition 타입 정의
- [x] Artifact 타입 정의
- [x] Enum 타입 정의

**예상 변경 파일:**
- `packages/shared/src/types/execution.ts` - 실행 타입
- `packages/shared/src/types/artifact.ts` - 아티팩트 타입
- `packages/shared/src/types/index.ts` - export 업데이트

### 3단계: DTO 정의 (backend)
- [x] CreateExecutionDto 정의
- [x] UpdateExecutionDto 정의
- [x] ExecutionFilterDto 정의
- [x] PaginationDto 정의
- [x] CreateArtifactDto 정의

**예상 변경 파일:**
- `packages/backend/src/dto/execution.dto.ts` - 실행 DTO
- `packages/backend/src/dto/artifact.dto.ts` - 아티팩트 DTO
- `packages/backend/src/dto/pagination.dto.ts` - 페이지네이션 DTO
- `packages/backend/src/dto/index.ts` - export

### 4단계: Prisma 스크립트 추가
- [x] prisma generate 스크립트 추가
- [x] prisma migrate 스크립트 추가
- [x] db:push 스크립트 추가

**예상 변경 파일:**
- `packages/backend/package.json` - 스크립트 추가

### 5단계: 검증
- [x] TypeScript 컴파일 확인
- [x] pnpm build 성공
- [x] CI 통과

## 검증 방법

### 1. 빌드 검증

| 검증 항목 | 명령어 | 성공 기준 | 상태 |
|----------|--------|----------|------|
| 의존성 설치 | `pnpm install` | exit code 0, 에러 없음 | ✅ |
| 전체 빌드 | `pnpm build` | 3개 패키지 모두 성공 | ✅ |
| shared 빌드 | `pnpm --filter @claude-agent/shared build` | dist/ 폴더 생성 | ✅ |
| backend 빌드 | `pnpm --filter @claude-agent/backend build` | dist/ 폴더 생성 | ✅ |

### 2. 타입 검증

| 검증 항목 | 검증 방법 | 성공 기준 | 상태 |
|----------|----------|----------|------|
| Prisma 스키마 문법 | `prisma validate` | 문법 에러 없음 | ✅ |
| TypeScript 컴파일 | `tsc --noEmit` | 타입 에러 0개 | ✅ |
| shared → backend import | backend에서 shared 타입 사용 | 컴파일 성공 | ✅ |
| shared → frontend import | frontend에서 shared 타입 사용 | 컴파일 성공 | ✅ |

### 3. 스키마 일관성 검증

| 검증 항목 | 검증 방법 | 성공 기준 | 상태 |
|----------|----------|----------|------|
| Prisma ↔ TypeScript 일치 | 수동 비교 | 모든 필드 타입 일치 | ✅ |
| Enum 값 일치 | `ExecutionStatus` 비교 | 5개 상태 동일 | ✅ |
| 필수/옵션 필드 일치 | `?` 마커 비교 | 일치 | ✅ |

**검증 체크리스트:**
```
Prisma Execution.status  ↔  TypeScript ExecutionStatus     ✅
Prisma Artifact.type     ↔  TypeScript ArtifactType        ✅
Prisma Artifact.status   ↔  TypeScript ArtifactStatus      ✅
```

### 4. CI/CD 검증

| 검증 항목 | 검증 방법 | 성공 기준 | 상태 |
|----------|----------|----------|------|
| GitHub Actions 실행 | `gh run list --limit 1` | status: completed | ✅ |
| CI 워크플로우 통과 | `gh run view <id>` | conclusion: success | ✅ |
| 빌드 아티팩트 생성 | CI 로그 확인 | 3 packages built | ✅ |

### 5. 파일 존재 검증

```bash
# 필수 파일 존재 확인
[ -f packages/backend/prisma/schema.prisma ]     # ✅
[ -f packages/backend/.env.example ]              # ✅
[ -f packages/shared/src/types/execution.ts ]     # ✅
[ -f packages/shared/src/types/artifact.ts ]      # ✅
[ -f packages/backend/src/dto/index.ts ]          # ✅
```

### 6. 검증 실패 시 대응

| 실패 유형 | 원인 분석 | 대응 방법 |
|----------|----------|----------|
| 빌드 실패 | 의존성 문제 | `pnpm install --force` 후 재빌드 |
| 타입 에러 | 스키마 불일치 | Prisma ↔ TypeScript 타입 동기화 |
| CI 실패 | 환경 차이 | 로컬 node 버전 확인 (>=18) |
| Import 에러 | 경로 문제 | tsconfig paths 설정 확인 |

## 의존성
- 선행 조건: FEAT-001 (모노레포 구조)
- 영향 범위: FEAT-002, FEAT-003, FEAT-004, 모든 API 명세

## 롤백 계획
git reset --hard를 통해 이전 상태로 복구 가능
