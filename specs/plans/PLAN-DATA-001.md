# PLAN-DATA-001: Database Schema & Data Models 구현

## 메타데이터
- **ID**: PLAN-DATA-001
- **작성일**: 2025-12-27
- **관련 명세**: DATA-001
- **예상 파일 변경**: 10개+
- **상태**: 진행중

## 목표
DATA-001 명세에 따라 Prisma ORM 기반 데이터베이스 스키마와 TypeScript 데이터 모델을 구현합니다.

## 작업 분할

### 1단계: Prisma 설정
- [ ] Prisma 패키지 설치 (backend)
- [ ] prisma/schema.prisma 생성
- [ ] .env.example 추가 (DATABASE_URL 템플릿)

**예상 변경 파일:**
- `packages/backend/package.json` - Prisma 의존성 추가
- `packages/backend/prisma/schema.prisma` - Prisma 스키마
- `packages/backend/.env.example` - 환경변수 템플릿

### 2단계: TypeScript 타입 정의 (shared)
- [ ] Execution 관련 타입 정의
- [ ] StatusTransition 타입 정의
- [ ] Artifact 타입 정의
- [ ] Enum 타입 정의

**예상 변경 파일:**
- `packages/shared/src/types/execution.ts` - 실행 타입
- `packages/shared/src/types/artifact.ts` - 아티팩트 타입
- `packages/shared/src/types/index.ts` - export 업데이트

### 3단계: DTO 정의 (backend)
- [ ] CreateExecutionDto 정의
- [ ] UpdateExecutionDto 정의
- [ ] ExecutionFilterDto 정의
- [ ] PaginationDto 정의
- [ ] CreateArtifactDto 정의

**예상 변경 파일:**
- `packages/backend/src/dto/execution.dto.ts` - 실행 DTO
- `packages/backend/src/dto/artifact.dto.ts` - 아티팩트 DTO
- `packages/backend/src/dto/pagination.dto.ts` - 페이지네이션 DTO
- `packages/backend/src/dto/index.ts` - export

### 4단계: Prisma 스크립트 추가
- [ ] prisma generate 스크립트 추가
- [ ] prisma migrate 스크립트 추가
- [ ] db:push 스크립트 추가

**예상 변경 파일:**
- `packages/backend/package.json` - 스크립트 추가

### 5단계: 검증
- [ ] TypeScript 컴파일 확인
- [ ] pnpm build 성공
- [ ] CI 통과

## 검증 방법
- [ ] `pnpm build` 성공
- [ ] TypeScript 타입 에러 없음
- [ ] shared 패키지 타입이 backend에서 import 가능
- [ ] CI 통과 확인

## 의존성
- 선행 조건: FEAT-001 (모노레포 구조)
- 영향 범위: FEAT-002, FEAT-003, FEAT-004, 모든 API 명세

## 롤백 계획
git reset --hard를 통해 이전 상태로 복구 가능
