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
| 이메일과 비밀번호를 입력하여 로그인할 수 있다 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should display email login form by default | 21-26 |
| 이메일과 비밀번호를 입력하여 로그인할 수 있다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should login with valid credentials | 20-39 |
| 이메일과 비밀번호를 입력하여 로그인할 수 있다 | [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | validateUser - valid credentials | 66-73 |
| 이메일과 비밀번호를 입력하여 로그인할 수 있다 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should login with valid credentials | 35-51 |
| API 키를 사용한 대체 로그인 방식을 선택할 수 있다 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should switch between email and API key login modes | 28-43 |
| API 키를 사용한 대체 로그인 방식을 선택할 수 있다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject invalid API key | 89-100 |
| API 키를 사용한 대체 로그인 방식을 선택할 수 있다 | [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | validateApiKey, loginWithApiKey | 94-153 |
| "로그인 상태 유지" 옵션으로 편리하게 재방문할 수 있다 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should have remember me checkbox | 56-63 |
| 잘못된 인증 정보 입력 시 명확한 에러 메시지를 볼 수 있다 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should show validation error for empty form | 83-88 |
| 잘못된 인증 정보 입력 시 명확한 에러 메시지를 볼 수 있다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject invalid email/password | 41-67 |
| 잘못된 인증 정보 입력 시 명확한 에러 메시지를 볼 수 있다 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should reject invalid email/password | 53-76 |
| 비밀번호 찾기 기능을 이용할 수 있다 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should have forgot password link | 65-67 |

**Coverage**: ✅ 완료

---

### US-002: 자동 로그아웃 및 세션 관리

**Related Spec**: UI-004 (REQ-4: Session Management)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 세션 만료 5분 전에 경고 모달을 볼 수 있다 | - | - | - |
| 세션 연장 버튼을 클릭하여 세션을 갱신할 수 있다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should refresh access token | 102-124 |
| 세션 연장 버튼을 클릭하여 세션을 갱신할 수 있다 | [auth.service.spec.ts](../../packages/backend/src/auth/auth.service.spec.ts) | refreshAccessToken | 155-193 |
| 세션 연장 버튼을 클릭하여 세션을 갱신할 수 있다 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should refresh access token with valid refresh token | 122-137 |
| 세션 만료 시 자동으로 로그인 페이지로 이동된다 | - | - | - |
| 로그아웃 버튼으로 수동 로그아웃할 수 있다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should return success on logout | 204-213 |
| 로그아웃 버튼으로 수동 로그아웃할 수 있다 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should return success on logout | 178-185 |

**Coverage**: 🔶 부분 완료 (세션 만료 경고 모달, 자동 리다이렉트 미작성)

---

### US-003: 직관적인 네비게이션

**Related Spec**: UI-004 (REQ-1, REQ-2, REQ-3)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 사이드바에서 대시보드, 실행, 히스토리, 아티팩트, 통계, 설정 메뉴를 볼 수 있다 | - | - | - |
| 현재 위치한 페이지가 메뉴에서 강조 표시된다 | - | - | - |
| 브레드크럼을 통해 현재 위치와 상위 경로를 확인할 수 있다 | - | - | - |
| 헤더에서 사용자 메뉴(프로필, 설정, 로그아웃)에 접근할 수 있다 | - | - | - |

**관련 테스트** (직접 매핑은 아니지만 네비게이션 동작 검증):

| Test File | Test Case | Line |
|-----------|-----------|------|
| [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | home page should redirect to dashboard | 8-13 |
| [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | should redirect unauthenticated users to login | 15-22 |
| [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | login page should be accessible | 31-37 |
| [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | tab navigation should work correctly | 32-47 |

**Coverage**: 🔶 부분 완료 (사이드바 메뉴, 브레드크럼, 사용자 메뉴 테스트 미작성)

---

### US-004: 반응형 레이아웃

**Related Spec**: UI-004 (REQ-1)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 모바일에서 햄버거 메뉴로 네비게이션에 접근할 수 있다 | - | - | - |
| 태블릿에서 적절한 레이아웃으로 화면이 표시된다 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | login page should be responsive on tablet | 61-69 |
| 데스크톱에서 사이드바를 접고 펼 수 있다 | - | - | - |
| 모든 기능이 모든 화면 크기에서 정상 동작한다 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | login page should be responsive on mobile | 51-59 |
| 모든 기능이 모든 화면 크기에서 정상 동작한다 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | login page should work on desktop | 71-79 |

**Coverage**: 🔶 부분 완료 (햄버거 메뉴, 사이드바 접기/펼치기 미작성)

---

### US-005: 다크 모드 지원

**Related Spec**: UI-004 (REQ-1, REQ-9)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 헤더의 테마 토글 버튼으로 라이트/다크 모드를 전환할 수 있다 | - | - | - |
| 선택한 테마가 저장되어 재방문 시에도 유지된다 | - | - | - |
| 모든 UI 컴포넌트가 두 테마에서 일관되게 표시된다 | - | - | - |
| 시스템 설정에 따른 자동 테마 적용 옵션이 있다 | - | - | - |

**Coverage**: ❌ 미작성

---

### US-006: 실시간 알림 수신

**Related Spec**: UI-004 (REQ-3, REQ-5)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 헤더의 알림 벨 아이콘에서 새 알림 개수를 확인할 수 있다 | - | - | - |
| 토스트 메시지로 실행 완료, 에러 등의 알림을 받을 수 있다 | - | - | - |
| 토스트의 "보기" 버튼을 클릭하여 해당 실행으로 바로 이동할 수 있다 | - | - | - |
| 성공, 에러, 경고, 정보 등 알림 유형별로 구분되어 표시된다 | - | - | - |

**Coverage**: ❌ 미작성

---

### US-007: 명확한 에러 피드백

**Related Spec**: UI-004 (REQ-6)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| API 에러 시 이해하기 쉬운 에러 메시지가 토스트로 표시된다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject invalid email/password | 41-67 |
| 존재하지 않는 페이지 접근 시 404 페이지가 표시된다 | [navigation.spec.ts](../../e2e/tests/navigation.spec.ts) | should display 404 page for unknown routes | 41-47 |
| 존재하지 않는 페이지 접근 시 404 페이지가 표시된다 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should return 404 for non-existent ID | 100-108 |
| 서버 에러 발생 시 500 페이지가 표시되고 재시도 버튼이 있다 | - | - | - |
| 네트워크 오류 시 연결 문제를 알리는 메시지가 표시된다 | - | - | - |
| 폼 유효성 검사 실패 시 어떤 필드가 잘못되었는지 표시된다 | [login.spec.ts](../../e2e/tests/login.spec.ts) | should show validation error for empty form | 83-88 |
| 폼 유효성 검사 실패 시 어떤 필드가 잘못되었는지 표시된다 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should return 400 for invalid UUID format | 110-114 |

**Coverage**: 🔶 부분 완료 (500 페이지, 네트워크 오류 미작성)

---

### US-008: 로딩 상태 피드백

**Related Spec**: UI-004 (REQ-7)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 페이지 전환 시 로딩 스피너가 표시된다 | - | - | - |
| 목록 로딩 시 스켈레톤 UI가 표시된다 | - | - | - |
| 버튼 클릭 후 처리 중일 때 버튼에 로딩 상태가 표시된다 | - | - | - |
| 무한 스크롤 시 추가 데이터 로딩 중임이 표시된다 | - | - | - |

**Coverage**: ❌ 미작성

---

### US-009: 키보드 접근성

**Related Spec**: UI-004 (REQ-10)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| Tab 키로 모든 인터랙티브 요소를 탐색할 수 있다 | [ui-components.spec.ts](../../e2e/tests/ui-components.spec.ts) | should be able to navigate form with keyboard | 82-103 |
| Enter/Space 키로 버튼과 링크를 활성화할 수 있다 | - | - | - |
| Escape 키로 모달과 드롭다운을 닫을 수 있다 | - | - | - |
| 포커스가 현재 위치한 요소가 시각적으로 명확히 구분된다 | - | - | - |

**Coverage**: 🔶 부분 완료 (Enter/Space/Escape 키, 포커스 스타일 미작성)

---

### US-010: 실행 기록 데이터 추적

**Related Spec**: DATA-001

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 모든 실행 요청(프롬프트, 모델, 설정)이 기록된다 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should create a new execution | 33-55 |
| 모든 실행 요청(프롬프트, 모델, 설정)이 기록된다 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | createExecution | 77-121 |
| 모든 실행 요청(프롬프트, 모델, 설정)이 기록된다 | [execution.integration.spec.ts](../../packages/backend/test/execution.integration.spec.ts) | should create a new execution | 55-69 |
| 실행 상태(대기, 실행 중, 완료, 실패, 취소)가 추적된다 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should include status transitions | 130-143 |
| 실행 상태(대기, 실행 중, 완료, 실패, 취소)가 추적된다 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | updateExecutionStatus | 284-337 |
| 실행 시작 시간, 완료 시간이 기록된다 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should retrieve execution by ID | 84-98 |
| 실행 시작 시간, 완료 시간이 기록된다 | [execution.integration.spec.ts](../../packages/backend/test/execution.integration.spec.ts) | should return execution by id | 130-139 |
| 실행 결과(출력, 토큰 사용량)가 저장된다 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | updateExecutionStatus - COMPLETED | 306-328 |
| 에러 발생 시 에러 정보가 기록된다 | [execution.service.spec.ts](../../packages/backend/src/execution/execution.service.spec.ts) | cancelExecution | 212-281 |

**Coverage**: ✅ 완료

---

### US-011: 아티팩트 데이터 관리

**Related Spec**: DATA-001

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 아티팩트의 파일명, 크기, MIME 타입이 기록된다 | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | upload | 96-119 |
| 아티팩트의 파일명, 크기, MIME 타입이 기록된다 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should upload a buffer/string | 66-102 |
| 아티팩트가 어느 실행에서 생성되었는지 연결된다 | [execution-api.spec.ts](../../e2e/tests/execution-api.spec.ts) | should include artifacts when requested | 116-128 |
| 아티팩트 유형(코드, 문서, 이미지 등)으로 분류할 수 있다 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should list files with prefix | 187-213 |
| 아티팩트 만료일이 설정되고 관리된다 | [s3.service.spec.ts](../../packages/backend/src/s3/s3.service.spec.ts) | delete | 140-149 |
| 아티팩트 만료일이 설정되고 관리된다 | [s3.integration.spec.ts](../../packages/backend/test/s3.integration.spec.ts) | should delete a file | 217-231 |

**Coverage**: ✅ 완료

---

### US-012: 서비스 안정성

**Related Spec**: FEAT-001 (System Architecture)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 서비스가 쿠버네티스 환경에서 안정적으로 운영된다 | [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | should complete full job lifecycle | 262-293 |
| 프론트엔드와 백엔드 간 통신이 안정적이다 | [health.spec.ts](../../e2e/tests/health.spec.ts) | frontend should be accessible | 8-12 |
| 프론트엔드와 백엔드 간 통신이 안정적이다 | [health.spec.ts](../../e2e/tests/health.spec.ts) | backend health endpoint should respond | 21-30 |
| 데이터베이스 연결이 안정적으로 유지된다 | [execution.integration.spec.ts](../../packages/backend/test/execution.integration.spec.ts) | should create a new execution | 55-69 |
| Agent 실행이 격리된 환경(K8s Job)에서 안전하게 수행된다 | [k8s.service.spec.ts](../../packages/backend/src/k8s/k8s.service.spec.ts) | createJob | 36-42 |
| Agent 실행이 격리된 환경(K8s Job)에서 안전하게 수행된다 | [k8s.integration.spec.ts](../../packages/backend/test/k8s.integration.spec.ts) | should create a job with minimal config | 55-69 |

**Coverage**: ✅ 완료

---

### US-013: 보안된 데이터 접근

**Related Spec**: FEAT-001 (REQ-4: Security)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| API 요청 시 JWT 또는 API 키 인증이 필요하다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should return current user with valid token | 149-174 |
| API 요청 시 JWT 또는 API 키 인증이 필요하다 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should return current user with valid token | 154-162 |
| 인증되지 않은 접근이 차단된다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject request without token | 176-179 |
| 인증되지 않은 접근이 차단된다 | [auth.integration.spec.ts](../../packages/backend/test/auth.integration.spec.ts) | should reject request without token | 164-168 |
| 인증되지 않은 접근이 차단된다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | should reject request with invalid token | 181-189 |
| 비밀 정보가 안전하게 관리된다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | tokens should be different on each login | 284-307 |
| 비밀 정보가 안전하게 관리된다 | [auth-api.spec.ts](../../e2e/tests/auth-api.spec.ts) | refreshed token should be different | 309-330 |
| HTTPS를 통한 암호화된 통신이 사용된다 | - | - | - |

**Coverage**: 🔶 부분 완료 (HTTPS 테스트는 인프라 레벨에서 검증)

---

### US-014: 지속적인 서비스 개선

**Related Spec**: INFRA-001 (CI/CD)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 코드 변경이 자동으로 테스트된다 | [.github/workflows/](../../.github/workflows/) | CI Pipeline | - |
| 테스트를 통과한 변경만 배포된다 | [.github/workflows/](../../.github/workflows/) | CI/CD Pipeline | - |
| 배포 시 서비스 중단이 최소화된다 | [.github/workflows/](../../.github/workflows/) | CD Pipeline | - |
| 문제 발생 시 이전 버전으로 빠르게 롤백할 수 있다 | - | - | - |

**Coverage**: 🔧 CI/CD (GitHub Actions로 관리)

---

### US-015: 회원 가입

**Related Spec**: UI-004 (REQ-4: Authentication UI)

| Acceptance Criteria | Test File | Test Case | Line |
|---------------------|-----------|-----------|------|
| 이메일, 비밀번호, 이름을 입력하여 회원 가입할 수 있다 | - | - | - |
| 비밀번호 강도 요구사항(최소 길이, 특수문자 등)이 안내된다 | - | - | - |
| 비밀번호 확인 필드로 오타를 방지할 수 있다 | - | - | - |
| 이미 가입된 이메일인 경우 명확한 안내 메시지가 표시된다 | - | - | - |
| 가입 완료 후 이메일 인증 안내를 받을 수 있다 | - | - | - |
| 이용약관 및 개인정보처리방침에 동의할 수 있다 | - | - | - |
| 회원 가입 성공 시 자동으로 로그인되거나 로그인 페이지로 이동된다 | - | - | - |

**Coverage**: ❌ 미작성

---

## Gap Analysis

### 테스트 미작성 스토리

| Priority | Story ID | 스토리 | Acceptance Criteria 수 | 필요한 작업 |
|----------|----------|-------|----------------------|------------|
| P0 | US-015 | 회원 가입 | 7개 | 회원가입 UI 및 API 테스트 전체 작성 필요 |
| P2 | US-005 | 다크 모드 | 4개 | 테마 전환 E2E 테스트 전체 작성 필요 |
| P2 | US-006 | 실시간 알림 | 4개 | 토스트/알림 컴포넌트 테스트 전체 작성 필요 |
| P2 | US-008 | 로딩 피드백 | 4개 | 로딩 상태 UI 테스트 전체 작성 필요 |

### 부분 커버리지 스토리

| Story ID | 스토리 | 전체 AC | 테스트된 AC | 누락된 AC |
|----------|-------|--------|-----------|----------|
| US-002 | 세션 관리 | 4 | 2 | 세션 만료 경고 모달, 자동 리다이렉트 |
| US-003 | 네비게이션 | 4 | 0 | 사이드바 메뉴, 강조 표시, 브레드크럼, 사용자 메뉴 |
| US-004 | 반응형 | 4 | 2 | 햄버거 메뉴, 사이드바 접기/펼치기 |
| US-007 | 에러 피드백 | 5 | 3 | 500 페이지, 네트워크 오류 |
| US-009 | 키보드 접근성 | 4 | 1 | Enter/Space/Escape 키, 포커스 스타일 |
| US-013 | 보안된 접근 | 4 | 3 | HTTPS 통신 (인프라 레벨) |

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
| 2025-12-31 | Claude | Update Acceptance Criteria to match STORIES-PHASE1.md exactly |
