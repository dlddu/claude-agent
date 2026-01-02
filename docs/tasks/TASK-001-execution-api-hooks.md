# TASK-001: Execution API 클라이언트 및 React Hooks 구현

## 메타데이터
- **작성일**: 2026-01-02
- **예상 크기**: S (1-2시간)
- **상태**: 계획됨
- **관련 스토리**: US-010 (실행 기록 데이터 추적)
- **관련 인수 테스트**: AT-010.1, AT-010.2

## 작업 목표

이 작업을 완료하면 다음 인수 테스트가 통과합니다:
- [ ] AT-010.1: 모든 실행 요청(프롬프트, 모델, 설정)이 기록된다
- [ ] AT-010.2: 실행 상태(대기, 실행 중, 완료, 실패, 취소)가 추적된다

## 구현 범위

### 구현할 기능
1. Execution API 클라이언트 (`services/executionApi.ts`)
   - `create()`: POST /api/v1/executions
   - `get()`: GET /api/v1/executions/:id
   - `list()`: GET /api/v1/executions
   - `cancel()`: POST /api/v1/executions/:id/cancel
   - `getLogs()`: GET /api/v1/executions/:id/logs

2. React Query Hooks (`hooks/executions/`)
   - `useExecutions()`: 목록 조회 훅
   - `useExecution()`: 단일 조회 훅
   - `useCreateExecution()`: 생성 mutation 훅
   - `useCancelExecution()`: 취소 mutation 훅

3. Zod Validation Schema
   - `executionFormSchema`: 폼 유효성 검증

### 작성할 테스트
1. `services/executionApi.test.ts` - API 클라이언트 테스트
2. `hooks/executions/__tests__/useExecutions.test.ts` - 훅 테스트

### 구현 제외 항목
- UI 컴포넌트 (TASK-002, TASK-003에서 구현)
- 페이지 컴포넌트 (TASK-004, TASK-005에서 구현)
- 실시간 상태 갱신 (TASK-005에서 구현)

## 기술적 접근 방법

1. **API 클라이언트 구현**
   - 기존 `lib/api.ts`를 확장하여 execution 관련 API 추가
   - 타입 안전성을 위해 `@claude-agent/shared` 타입 활용

2. **React Query 설정**
   - `@tanstack/react-query` 사용
   - 캐싱 및 자동 리페치 설정

3. **Zod 스키마 정의**
   - UI-001 명세의 폼 검증 스키마 구현
   - react-hook-form과 통합 준비

## 테스트 전략

### 단위 테스트
- API 클라이언트 함수 모킹 테스트
- React Query 훅 테스트 (msw 또는 jest mock)

### 인수 테스트 실행 방법
```bash
pnpm --filter frontend test
```

## 완료 조건

이 작업은 다음 조건을 모두 만족할 때 완료됩니다:
1. [ ] 구현 코드 작성 완료
2. [ ] 단위 테스트 작성 및 통과
3. [ ] TypeScript 타입 에러 없음
4. [ ] GitHub Actions CI 통과
5. [ ] 추적성 매트릭스 업데이트

## 의존성

### 선행 작업
- FEAT-002: Agent Execution Management (✅ 완료)
- API-001~004: Execution APIs (✅ 완료)
- UI-004: Common Layout (✅ 완료)

### 후행 작업
- TASK-002: 실행 상태 컴포넌트 구현
- TASK-003: 실행 생성 폼 구현
- TASK-004: 실행 목록 페이지 구현
- TASK-005: 실행 상세 페이지 구현

## 추적성
- **명세서**: UI-001 (REQ-1, REQ-2, REQ-3)
- **사용자 스토리**: US-010
- **인수 테스트**: AT-010.1, AT-010.2
