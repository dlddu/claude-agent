# PLAN-001: 모노레포 구조 설정

## 메타데이터
- **ID**: PLAN-001
- **작성일**: 2025-12-27
- **관련 명세**: FEAT-001
- **예상 파일 변경**: 15개+
- **상태**: 완료

## 목표
FEAT-001 명세에 따라 pnpm workspace 기반 모노레포 구조를 설정합니다.
Frontend(Next.js), Backend(NestJS), Shared 패키지를 구성합니다.

## 작업 분할

### 1단계: pnpm workspace 및 루트 설정
- [x] pnpm-workspace.yaml 생성
- [x] 루트 package.json 생성
- [x] 루트 tsconfig.json 생성
- [x] .gitignore 업데이트

**예상 변경 파일:**
- `pnpm-workspace.yaml` - 워크스페이스 정의
- `package.json` - 루트 패키지 설정
- `tsconfig.json` - 기본 TypeScript 설정
- `.gitignore` - Node.js 관련 무시 패턴

### 2단계: shared 패키지 초기화
- [x] packages/shared 디렉토리 생성
- [x] packages/shared/package.json 생성
- [x] packages/shared/tsconfig.json 생성
- [x] 기본 타입 정의 파일 생성

**예상 변경 파일:**
- `packages/shared/package.json` - shared 패키지 설정
- `packages/shared/tsconfig.json` - TypeScript 설정
- `packages/shared/src/index.ts` - 진입점
- `packages/shared/src/types/index.ts` - 공통 타입 정의

### 3단계: backend 패키지 초기화
- [x] packages/backend 디렉토리 생성
- [x] NestJS 기본 구조 생성
- [x] shared 패키지 의존성 설정

**예상 변경 파일:**
- `packages/backend/package.json` - backend 패키지 설정
- `packages/backend/tsconfig.json` - TypeScript 설정
- `packages/backend/src/main.ts` - NestJS 진입점
- `packages/backend/src/app.module.ts` - 루트 모듈
- `packages/backend/nest-cli.json` - NestJS CLI 설정

### 4단계: frontend 패키지 초기화
- [x] packages/frontend 디렉토리 생성
- [x] Next.js 기본 구조 생성
- [x] shared 패키지 의존성 설정

**예상 변경 파일:**
- `packages/frontend/package.json` - frontend 패키지 설정
- `packages/frontend/tsconfig.json` - TypeScript 설정
- `packages/frontend/next.config.js` - Next.js 설정
- `packages/frontend/src/app/page.tsx` - 메인 페이지
- `packages/frontend/src/app/layout.tsx` - 레이아웃

### 5단계: Turborepo 설정
- [x] turbo.json 생성
- [x] 빌드 파이프라인 정의

**예상 변경 파일:**
- `turbo.json` - Turborepo 설정

### 6단계: 검증
- [x] pnpm install 실행
- [x] pnpm build 실행
- [x] 각 패키지 빌드 확인

## 검증 방법
- [x] `pnpm install` 성공
- [x] `pnpm build` 성공
- [x] shared 패키지가 backend, frontend에서 import 가능
- [ ] CI 통과 확인

## 의존성
- 선행 조건: 없음 (Root specification)
- 영향 범위: FEAT-002, FEAT-003, FEAT-004, DATA-001, 모든 API 명세

## 롤백 계획
git reset --hard를 통해 이전 상태로 복구 가능
