# CLAUDE.md - Spec Driven Development Guide

이 프로젝트는 **Spec Driven Development (SDD)** 방법론을 따릅니다.
모든 개발은 명세서(Specification)를 먼저 작성하고, 추적성 매트릭스를 통해 구현 상태를 관리합니다.

---

## 핵심 원칙

1. **명세 우선 (Spec First)**: 코드 작성 전 반드시 명세서를 먼저 작성
2. **추적 가능성 (Traceability)**: 모든 구현은 명세와 1:1로 매핑
3. **검증 가능성 (Verifiability)**: 각 명세 항목은 테스트로 검증 가능해야 함
4. **문서화 (Documentation)**: 변경사항은 명세서와 추적성 매트릭스에 즉시 반영

---

## 디렉토리 구조

```
/specs                    # 명세서 디렉토리
  ├── features/           # 기능 명세서
  │   └── FEAT-001.md     # 개별 기능 명세
  ├── api/                # API 명세서
  │   └── API-001.md      # API 엔드포인트 명세
  └── TRACEABILITY.md     # 추적성 매트릭스

/src                      # 소스 코드
/tests                    # 테스트 코드
```

---

## 추적성 매트릭스 (Traceability Matrix)

추적성 매트릭스는 `/specs/TRACEABILITY.md`에서 관리합니다.

### 매트릭스 형식

```markdown
| Spec ID | 명세 제목 | 구현 파일 | 테스트 파일 | 상태 |
|---------|----------|----------|------------|------|
| FEAT-001 | 사용자 인증 | src/auth/login.ts | tests/auth/login.test.ts | ✅ 완료 |
| FEAT-002 | 데이터 검증 | src/validation/index.ts | tests/validation.test.ts | 🚧 진행중 |
| API-001 | 로그인 API | src/api/auth.ts | tests/api/auth.test.ts | ⏳ 대기 |
```

### 상태 정의

| 상태 | 설명 |
|-----|------|
| ⏳ 대기 | 명세 작성 완료, 구현 대기 |
| 🚧 진행중 | 구현 진행 중 |
| 🧪 테스트중 | 구현 완료, 테스트 작성/실행 중 |
| ✅ 완료 | 구현 및 테스트 완료 |
| ❌ 실패 | 테스트 실패 또는 명세 불충족 |
| 🔄 변경필요 | 명세 변경으로 재작업 필요 |

---

## 명세서 작성 템플릿

### 기능 명세서 (FEAT-XXX.md)

```markdown
# FEAT-XXX: [기능 제목]

## 메타데이터
- **ID**: FEAT-XXX
- **작성일**: YYYY-MM-DD
- **상태**: Draft | Review | Approved
- **우선순위**: High | Medium | Low

## 개요
[기능에 대한 간단한 설명]

## 요구사항
- [ ] REQ-1: [구체적인 요구사항 1]
- [ ] REQ-2: [구체적인 요구사항 2]

## 인터페이스
[입력/출력 정의, 함수 시그니처 등]

## 제약조건
[성능, 보안, 호환성 등의 제약사항]

## 검증 기준
[이 기능이 완료되었다고 판단할 수 있는 기준]

## 관련 명세
- 의존: [이 기능이 의존하는 다른 명세 ID]
- 연관: [관련된 다른 명세 ID]
```

### API 명세서 (API-XXX.md)

```markdown
# API-XXX: [API 엔드포인트]

## 메타데이터
- **ID**: API-XXX
- **작성일**: YYYY-MM-DD
- **상태**: Draft | Review | Approved

## 엔드포인트
- **Method**: GET | POST | PUT | DELETE
- **Path**: /api/v1/resource
- **인증**: Required | Optional | None

## Request
### Headers
| Header | Required | Description |
|--------|----------|-------------|

### Body
```json
{
  "field": "type - description"
}
```

## Response
### Success (200)
```json
{
  "data": {}
}
```

### Error Codes
| Code | Description |
|------|-------------|

## 관련 명세
- FEAT-XXX
```

---

## 개발 워크플로우

### 1. 명세 작성 단계
```
1. specs/features/ 또는 specs/api/에 새 명세 파일 생성
2. 템플릿에 따라 명세 작성
3. specs/TRACEABILITY.md에 새 항목 추가 (상태: ⏳ 대기)
```

### 2. 구현 단계
```
1. 추적성 매트릭스 상태를 🚧 진행중으로 변경
2. 명세에 따라 코드 구현
3. 구현 파일 경로를 매트릭스에 기록
```

### 3. 테스트 단계
```
1. 추적성 매트릭스 상태를 🧪 테스트중으로 변경
2. 명세의 검증 기준에 따라 테스트 작성
3. 테스트 파일 경로를 매트릭스에 기록
4. 모든 테스트 통과 시 ✅ 완료로 변경
```

### 4. 변경 관리
```
1. 명세 변경 시 관련 매트릭스 항목을 🔄 변경필요로 표시
2. 영향받는 모든 구현/테스트 파일 식별
3. 재작업 후 검증 진행
```

---

## Claude 작업 지침

### 새 기능 개발 요청 시
1. 먼저 `/specs/TRACEABILITY.md` 확인
2. 관련 명세가 있는지 검색
3. 명세가 없으면 명세 작성 먼저 제안
4. 명세가 있으면 해당 명세에 따라 구현

### 코드 수정 요청 시
1. 수정 대상 코드와 연결된 명세 ID 확인
2. 명세 변경이 필요한지 판단
3. 추적성 매트릭스 업데이트
4. 관련 테스트 확인 및 수정

### 버그 수정 요청 시
1. 버그와 관련된 명세 ID 식별
2. 명세 불충족인지, 구현 오류인지 구분
3. 수정 후 해당 테스트 실행
4. 매트릭스 상태 업데이트

---

## 명세 ID 규칙

| 접두사 | 용도 | 예시 |
|-------|-----|------|
| FEAT | 기능 명세 | FEAT-001, FEAT-002 |
| API | API 엔드포인트 | API-001, API-002 |
| DATA | 데이터 모델 | DATA-001, DATA-002 |
| UI | UI 컴포넌트 | UI-001, UI-002 |
| SEC | 보안 요구사항 | SEC-001, SEC-002 |
| PERF | 성능 요구사항 | PERF-001, PERF-002 |

---

## 추적성 검증 명령

프로젝트에서 추적성을 검증하기 위한 체크리스트:

```bash
# 명세 없이 구현된 파일 찾기
# -> src/ 내 파일 중 TRACEABILITY.md에 없는 것

# 구현 없는 명세 찾기
# -> TRACEABILITY.md에서 상태가 ⏳인 항목

# 테스트 없는 구현 찾기
# -> TRACEABILITY.md에서 테스트 파일이 비어있는 항목
```

---

## 품질 기준

- 모든 명세는 구현 전 리뷰 완료 (상태: Approved)
- 모든 구현은 해당 명세 ID를 주석으로 포함
- 모든 테스트는 명세의 검증 기준을 커버
- 추적성 매트릭스 커버리지 100% 유지

```typescript
// 코드 내 명세 참조 예시
/**
 * 사용자 로그인 처리
 * @spec FEAT-001
 * @spec API-001
 */
export async function login(credentials: Credentials): Promise<AuthResult> {
  // 구현
}
```

---

## 참고

- 명세 변경 시 반드시 변경 이력을 명세 파일 하단에 기록
- 대규모 변경은 새 명세로 작성하고 기존 명세는 Deprecated 처리
- 긴급 버그 수정 시에도 사후에 명세 업데이트 필수
