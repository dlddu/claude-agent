# Phase 1 User Stories - Test Mapping

## Metadata
- **Phase**: 1 (Foundation)
- **Created**: 2025-12-31
- **Related Document**: [STORIES-PHASE1.md](./STORIES-PHASE1.md)
- **Status**: Active

## Overview

이 문서는 Phase 1 사용자 스토리와 실제 테스트 파일 간의 매핑을 정의합니다.
각 사용자 스토리의 Acceptance Criteria가 어떤 테스트로 검증되는지 추적합니다.

---

## Test Coverage Summary

| 구분 | 개수 | 비율 |
|-----|-----|------|
| 전체 스토리 | 15 | 100% |
| 테스트 커버리지 있음 | 11 | 73% |
| 테스트 미작성 | 4 | 27% |

### Coverage by Story

| Status | Story IDs |
|--------|-----------|
| ✅ 완료 | US-001, US-002, US-003, US-004, US-007, US-009, US-010, US-011, US-012, US-013 |
| ❌ 미작성 | US-005, US-006, US-008, US-015 |
| 🔧 CI/CD | US-014 |

---

## Test File Inventory

### E2E Tests

| File | Spec Reference | Description |
|------|----------------|-------------|
| [login.spec.ts](../../e2e/tests/login.spec.ts) | UI-004 | 로그인 페이지 UI 테스트 |
| [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | UI-004 | 네비게이션 및 라우팅 테스트 |
| [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | UI-004 | UI 컴포넌트, 반응형, 키보드 접근성 |
| [health.spec.ts](../../e2e/tests/health.spec.ts) | INFRA-001 | 프론트엔드/백엔드 헬스체크 |
| [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | FEAT-001 REQ-4 | 인증 API E2E 테스트 |
| [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | FEAT-002, API-001~004 | 실행 API E2E 테스트 |

### Unit Tests

| File | Spec Reference | Description |
|------|----------------|-------------|
| [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | FEAT-001 REQ-4 | 인증 서비스 유닛 테스트 |
| [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | FEAT-002 | 실행 서비스 유닛 테스트 |
| [k8s.service.spec.ts](../../packages/backend/src/k8s/k8s.service.spec.ts) | FEAT-001 REQ-2, REQ-3 | K8s 서비스 유닛 테스트 |
| [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | FEAT-001 REQ-3 | S3 서비스 유닛 테스트 |

### Integration Tests

| File | Spec Reference | Description |
|------|----------------|-------------|
| [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | FEAT-001 REQ-4 | 인증 통합 테스트 |
| [execution.integration.spec.ts](../../packages/backend/test/execution.integration.spec.ts) | FEAT-002, API-001~004 | 실행 통합 테스트 |
| [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | FEAT-001 REQ-2 | K8s 통합 테스트 |
| [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | FEAT-001 REQ-3 | S3 통합 테스트 |

---

## Story-Test Mapping

### US-001: 안전한 로그인

**Related Spec**: UI-004 (REQ-4: Authentication UI)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 이메일/비밀번호 로그인 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should display email login form by default | 21-26 |
| 이메일/비밀번호 로그인 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should login with valid credentials | 20-39 |
| 이메일/비밀번호 로그인 | [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | validateUser - valid credentials | 66-73 |
| 이메일/비밀번호 로그인 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should login with valid credentials | 35-51 |
| API 키 로그인 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should switch between email and API key login modes | 28-43 |
| API 키 로그인 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject invalid API key | 89-100 |
| API 키 로그인 | [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | validateApiKey, loginWithApiKey | 94-153 |
| 로그인 상태 유지 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should have remember me checkbox | 56-63 |
| 에러 메시지 표시 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should show validation error for empty form | 83-88 |
| 에러 메시지 표시 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject invalid email/password | 41-67 |
| 에러 메시지 표시 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should reject invalid email/password | 53-76 |
| 비밀번호 찾기 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should have forgot password link | 65-67 |

**Coverage**: ✅ 완료

---

### US-002: 자동 로그아웃 및 세션 관리

**Related Spec**: UI-004 (REQ-4: Session Management)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 세션 연장 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should refresh access token | 102-124 |
| 세션 연장 | [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | refreshAccessToken | 155-193 |
| 세션 연장 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should refresh access token with valid refresh token | 122-137 |
| 수동 로그아웃 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should return success on logout | 204-213 |
| 수동 로그아웃 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should return success on logout | 178-185 |
| 전체 라이프사이클 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | complete login -> access -> refresh -> logout flow | 215-259 |
| 전체 라이프사이클 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | Token Lifecycle | 188-229 |

**Coverage**: ✅ 완료 (세션 만료 경고 모달 테스트 제외)

---

### US-003: 직관적인 네비게이션

**Related Spec**: UI-004 (REQ-1, REQ-2, REQ-3)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 페이지 이동 | [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | home page should redirect to dashboard | 8-13 |
| 보호된 페이지 리다이렉트 | [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | should redirect unauthenticated users to login | 15-22 |
| 로그인 페이지 접근 | [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | login page should be accessible | 31-37 |
| 탭 네비게이션 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | tab navigation should work correctly | 32-47 |

**Coverage**: ✅ 완료 (사이드바 메뉴 상세 테스트, 브레드크럼 테스트 제외)

---

### US-004: 반응형 레이아웃

**Related Spec**: UI-004 (REQ-1)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 모바일 레이아웃 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | login page should be responsive on mobile | 51-59 |
| 태블릿 레이아웃 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | login page should be responsive on tablet | 61-69 |
| 데스크톱 레이아웃 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | login page should work on desktop | 71-79 |

**Coverage**: ✅ 완료 (햄버거 메뉴, 사이드바 접기/펼치기 테스트 제외)

---

### US-005: 다크 모드 지원

**Related Spec**: UI-004 (REQ-1, REQ-9)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 테마 토글 버튼 | - | - | - |
| 테마 저장/유지 | - | - | - |
| 시스템 설정 자동 적용 | - | - | - |

**Coverage**: ❌ 미작성

**필요한 테스트**:
- 테마 토글 버튼 클릭 시 다크/라이트 모드 전환
- localStorage에 테마 설정 저장 확인
- 페이지 새로고침 후 테마 유지 확인
- 시스템 prefers-color-scheme 설정 반영 확인

---

### US-006: 실시간 알림 수신

**Related Spec**: UI-004 (REQ-3, REQ-5)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 알림 벨 아이콘 | - | - | - |
| 토스트 메시지 | - | - | - |
| 알림 유형별 구분 | - | - | - |

**Coverage**: ❌ 미작성

**필요한 테스트**:
- 알림 벨 아이콘 표시 및 카운트 배지
- 토스트 메시지 표시 (성공, 에러, 경고, 정보)
- 토스트 자동 닫힘 타이밍
- 토스트 "보기" 버튼 클릭 시 해당 페이지 이동

---

### US-007: 명확한 에러 피드백

**Related Spec**: UI-004 (REQ-6)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 폼 유효성 검사 에러 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should show validation error for empty form | 83-88 |
| 404 페이지 | [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | should display 404 page for unknown routes | 41-47 |
| API 에러 메시지 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject invalid email/password | 41-67 |
| 잘못된 UUID 에러 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should return 400 for invalid UUID format | 110-114 |
| 404 Not Found | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should return 404 for non-existent ID | 100-108 |

**Coverage**: ✅ 완료 (500 페이지, 네트워크 오류 테스트 제외)

---

### US-008: 로딩 상태 피드백

**Related Spec**: UI-004 (REQ-7)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 로딩 스피너 | - | - | - |
| 스켈레톤 UI | - | - | - |
| 버튼 로딩 상태 | - | - | - |

**Coverage**: ❌ 미작성

**필요한 테스트**:
- 페이지 전환 시 로딩 스피너 표시
- 목록 로딩 시 스켈레톤 UI 표시
- 버튼 클릭 후 로딩 상태 (disabled + spinner)
- 무한 스크롤 로딩 인디케이터

---

### US-009: 키보드 접근성

**Related Spec**: UI-004 (REQ-10)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| Tab 키 네비게이션 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | should be able to navigate form with keyboard | 82-103 |
| 키보드 입력 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | keyboard type in email field | 93-95 |

**Coverage**: ✅ 완료 (Enter/Space/Escape 키 테스트, 포커스 스타일 테스트 제외)

---

### US-010: 실행 기록 데이터 추적

**Related Spec**: DATA-001

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 실행 생성 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should create a new execution | 33-55 |
| 실행 생성 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | createExecution | 77-121 |
| 실행 생성 | [execution.integration.spec.ts](../../packages/backend/test/execution.integration.spec.ts) | should create a new execution | 55-69 |
| 실행 조회 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should retrieve execution by ID | 84-98 |
| 실행 조회 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | getExecution | 123-165 |
| 실행 목록 조회 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should return paginated list | 147-159 |
| 실행 목록 조회 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | listExecutions | 167-210 |
| 상태 추적 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should include status transitions | 130-143 |
| 상태 추적 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | updateExecutionStatus | 284-337 |
| 실행 취소 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should cancel a PENDING execution | 214-231 |
| 실행 취소 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | cancelExecution | 212-281 |

**Coverage**: ✅ 완료

---

### US-011: 아티팩트 데이터 관리

**Related Spec**: DATA-001

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 아티팩트 조회 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should include artifacts when requested | 116-128 |
| S3 업로드 | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | upload | 96-119 |
| S3 업로드 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should upload a buffer/string | 66-102 |
| S3 다운로드 | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | download | 121-138 |
| S3 다운로드 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should download a file as buffer | 113-124 |
| S3 목록 조회 | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | list | 173-198 |
| S3 목록 조회 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should list files with prefix | 187-213 |
| S3 삭제 | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | delete | 140-149 |
| S3 삭제 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should delete a file | 217-231 |
| Presigned URL | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | getPresignedDownloadUrl | 200-206 |
| Presigned URL | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should generate presigned URL | 276-304 |

**Coverage**: ✅ 완료

---

### US-012: 서비스 안정성

**Related Spec**: FEAT-001 (System Architecture)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 프론트엔드 헬스체크 | [health.spec.ts](../../e2e/tests/health.spec.ts) | frontend should be accessible | 8-12 |
| 프론트엔드 타이틀 | [health.spec.ts](../../e2e/tests/health.spec.ts) | frontend should have correct title | 14-17 |
| 백엔드 헬스체크 | [health.spec.ts](../../e2e/tests/health.spec.ts) | backend health endpoint should respond | 21-30 |
| K8s Job 생성 | [k8s.service.spec.ts](../../packages/backend/src/k8s/k8s.service.spec.ts) | createJob | 36-42 |
| K8s Job 생성 | [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | should create a job with minimal config | 55-69 |
| K8s Job 상태 조회 | [k8s.service.spec.ts](../../packages/backend/src/k8s/k8s.service.spec.ts) | getJobStatus | 44-49 |
| K8s Job 상태 조회 | [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | should return job status for existing job | 127-139 |
| K8s Job 삭제 | [k8s.service.spec.ts](../../packages/backend/src/k8s/k8s.service.spec.ts) | deleteJob | 51-56 |
| K8s Job 삭제 | [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | should delete an existing job | 203-227 |
| K8s Job 라이프사이클 | [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | should complete full job lifecycle | 262-293 |

**Coverage**: ✅ 완료

---

### US-013: 보안된 데이터 접근

**Related Spec**: FEAT-001 (REQ-4: Security)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| JWT 인증 필요 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should return current user with valid token | 149-174 |
| JWT 인증 필요 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should return current user with valid token | 154-162 |
| 인증 없이 접근 차단 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject request without token | 176-179 |
| 인증 없이 접근 차단 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should reject request without token | 164-168 |
| 잘못된 토큰 거부 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject request with invalid token | 181-189 |
| 잘못된 토큰 거부 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should reject request with invalid token | 170-175 |
| 토큰 보안 (고유성) | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | tokens should be different on each login | 284-307 |
| 토큰 보안 (갱신) | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | refreshed token should be different | 309-330 |

**Coverage**: ✅ 완료

---

### US-014: 지속적인 서비스 개선

**Related Spec**: INFRA-001 (CI/CD)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 자동 테스트 | [.github/workflows/](../../.github/workflows/) | CI/CD Pipeline | - |
| 자동 배포 | [.github/workflows/](../../.github/workflows/) | CD Pipeline | - |

**Coverage**: 🔧 CI/CD (GitHub Actions로 관리)

---

### US-015: 회원 가입

**Related Spec**: UI-004 (REQ-4: Authentication UI)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 회원가입 폼 | - | - | - |
| 비밀번호 강도 검사 | - | - | - |
| 중복 이메일 체크 | - | - | - |
| 이메일 인증 | - | - | - |

**Coverage**: ❌ 미작성

**필요한 테스트**:
- 회원가입 폼 표시 및 입력 테스트
- 비밀번호 강도 요구사항 표시 및 검증
- 비밀번호 확인 필드 일치 검사
- 이미 가입된 이메일 에러 메시지
- 이용약관 동의 체크박스
- 회원가입 성공 후 리다이렉트

---

## Gap Analysis

### 테스트 미작성 항목

| Priority | Story ID | 스토리 | 필요한 작업 |
|----------|----------|-------|------------|
| P0 | US-015 | 회원 가입 | 회원가입 UI 및 API 테스트 작성 필요 |
| P2 | US-005 | 다크 모드 | 테마 전환 E2E 테스트 작성 필요 |
| P2 | US-006 | 실시간 알림 | 토스트/알림 컴포넌트 테스트 작성 필요 |
| P2 | US-008 | 로딩 피드백 | 로딩 상태 UI 테스트 작성 필요 |

### 부분 커버리지 항목

| Story ID | 스토리 | 누락된 테스트 |
|----------|-------|-------------|
| US-002 | 세션 관리 | 세션 만료 5분 전 경고 모달 테스트 |
| US-003 | 네비게이션 | 사이드바 메뉴 강조, 브레드크럼 테스트 |
| US-004 | 반응형 | 햄버거 메뉴, 사이드바 접기/펼치기 테스트 |
| US-007 | 에러 피드백 | 500 에러 페이지, 네트워크 오류 테스트 |
| US-009 | 키보드 접근성 | Enter/Space/Escape 키, 포커스 스타일 테스트 |

---

## Test Commands

```bash
# E2E 테스트 실행
pnpm --filter e2e test

# 백엔드 유닛 테스트 실행
pnpm --filter backend test

# 백엔드 통합 테스트 실행
pnpm --filter backend test:integration

# 전체 테스트 실행
pnpm test
```

---

## Change History

| Date | Author | Description |
|------|--------|-------------|
| 2025-12-31 | Claude | Initial creation - Phase 1 test mapping document |
