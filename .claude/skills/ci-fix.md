---
description: GitHub Actions CI가 실패한 경우, 실패 원인을 분석하고 통과할 때까지 수정합니다.
---

# CI Fix Skill - CI 실패 수정

이 skill은 GitHub Actions CI가 실패한 경우 원인을 분석하고, 통과할 때까지 수정 작업을 반복합니다.

## 사전 조건
- GitHub Actions 워크플로우가 실패한 상태여야 합니다
- `gh` CLI가 설치되어 있어야 합니다
- 코드 수정 권한이 있어야 합니다

## 실행 단계

### 1. 실패 정보 수집
```bash
# 최근 실패한 워크플로우 확인
gh run list --status failure --limit 5

# 실패한 워크플로우 상세 정보
gh run view <run-id> --json jobs,conclusion

# 실패한 job의 로그 확인
gh run view <run-id> --log-failed
```

### 2. 실패 원인 분석
실패 유형별 분석:

#### Lint 실패
```bash
# ESLint 오류 확인
pnpm lint
# 또는
pnpm turbo lint
```

#### Type Check 실패
```bash
# TypeScript 오류 확인
pnpm typecheck
# 또는
pnpm turbo typecheck
```

#### Test 실패
```bash
# 테스트 실행 및 오류 확인
pnpm test
# 또는
pnpm turbo test
```

#### Build 실패
```bash
# 빌드 오류 확인
pnpm build
# 또는
pnpm turbo build
```

### 3. 오류 수정
분석된 원인에 따라 코드를 수정합니다:

| 실패 유형 | 수정 방법 |
|----------|----------|
| Lint | 코드 스타일 수정, `pnpm lint --fix` 실행 |
| TypeScript | 타입 오류 수정, 누락된 타입 추가 |
| Test | 테스트 코드 수정 또는 구현 코드 수정 |
| Build | 빌드 설정 수정, 의존성 문제 해결 |

### 4. 로컬 검증
수정 후 로컬에서 검증합니다:
```bash
# 전체 검증 실행
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### 5. 커밋 및 Push
```bash
# 변경사항 커밋
git add .
git commit -m "fix: [실패 유형] 수정 - [Spec ID]"

# Push
git push
```

### 6. CI 재실행 대기
`ci-wait` skill과 동일하게 CI 완료를 대기합니다.

### 7. 반복
CI가 다시 실패하면 1-6 단계를 반복합니다.

## 일반적인 실패 원인 및 해결책

### ESLint 오류
```
error: 'x' is defined but never used
→ 해결: 미사용 변수 제거 또는 사용

error: Missing return type on function
→ 해결: 함수 반환 타입 명시
```

### TypeScript 오류
```
error TS2339: Property 'x' does not exist
→ 해결: 타입 정의 추가 또는 수정

error TS2345: Argument type mismatch
→ 해결: 올바른 타입으로 인자 수정
```

### Test 실패
```
Expected: X, Received: Y
→ 해결: 구현 로직 수정 또는 테스트 기대값 수정

Timeout - Async callback was not invoked
→ 해결: 비동기 처리 로직 수정
```

### Build 실패
```
Module not found: Can't resolve 'x'
→ 해결: 의존성 설치 또는 import 경로 수정

Out of memory
→ 해결: 빌드 최적화 또는 메모리 설정 조정
```

## 출력 형식

```
## CI 수정 보고

### 원래 실패 정보
- **Run ID**: 12345678
- **실패한 Job**: unit-test
- **오류 메시지**: [요약]

### 수정 내용
1. `src/xxx/yyy.ts`: [수정 내용]
2. `tests/xxx/yyy.test.ts`: [수정 내용]

### 수정 커밋
- **Commit**: def5678
- **Message**: fix: unit-test 실패 수정 - FEAT-001

### 재실행 결과
- **Run ID**: 12345679
- **Status**: ✅ SUCCESS

### 수정 시도 횟수
- 총 2회 시도 후 성공
```

## 반복 제한
- 최대 수정 시도 횟수: 5회
- 5회 초과 시 사용자에게 직접 확인 요청

## 주의사항
- 테스트를 건너뛰거나 무효화하는 방식으로 해결하지 않습니다
- 린트 규칙을 비활성화하는 것은 최후의 수단입니다
- 수정 내용이 기존 명세서와 충돌하면 명세서 수정을 먼저 진행합니다
- 각 수정 커밋에는 관련 Spec ID를 포함합니다
