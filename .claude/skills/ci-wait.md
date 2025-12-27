---
description: 구현 완료 후 변경사항을 push하고, GitHub Actions CI가 완료될 때까지 모니터링합니다.
---

# CI Wait Skill - GitHub Actions CI 모니터링

이 skill은 코드 변경사항을 push한 후 GitHub Actions CI 워크플로우가 완료될 때까지 대기하고 결과를 보고합니다.

## 사전 조건
- 변경사항이 커밋되어 있어야 합니다
- GitHub 저장소에 push 권한이 있어야 합니다
- `gh` CLI가 설치되어 있어야 합니다

## 실행 단계

### 1. 변경사항 확인 및 Push
```bash
# 현재 브랜치 확인
git branch --show-current

# 커밋되지 않은 변경사항 확인
git status

# 원격 저장소에 push
git push -u origin <branch-name>
```

### 2. CI 워크플로우 실행 대기
push 직후 워크플로우가 트리거될 때까지 잠시 대기합니다 (약 5-10초).

### 3. CI 상태 모니터링
`gh` CLI를 사용하여 워크플로우 상태를 확인합니다:

```bash
# 현재 브랜치의 최근 워크플로우 실행 목록
gh run list --branch <branch-name> --limit 5

# 특정 워크플로우 실행 상태 확인
gh run view <run-id>

# 실시간 로그 확인 (실행 중인 경우)
gh run watch <run-id>
```

### 4. 워크플로우 완료 대기
워크플로우가 완료될 때까지 주기적으로 상태를 확인합니다:
- 확인 간격: 30초
- 최대 대기 시간: 30분

```bash
# 워크플로우 완료까지 대기
gh run watch <run-id> --exit-status
```

### 5. 결과 수집
워크플로우 완료 후 결과를 수집합니다:

```bash
# 워크플로우 실행 결과 상세 조회
gh run view <run-id> --json status,conclusion,jobs

# 실패한 job의 로그 확인
gh run view <run-id> --log-failed
```

## 모니터링 대상 워크플로우

INFRA-001 명세에 따른 주요 워크플로우:

| 워크플로우 | 파일 | 트리거 |
|-----------|-----|--------|
| CI | ci.yml | PR, push to main/develop |
| Integration | integration.yml | PR to main |
| Docker | docker.yml | push to main, tags |

## 출력 형식

### 성공 시
```
## CI 실행 결과: SUCCESS

### 워크플로우 정보
- **Run ID**: 12345678
- **Branch**: feature/xxx
- **Commit**: abc1234
- **Duration**: 5m 30s

### Job 결과
| Job | Status | Duration |
|-----|--------|----------|
| lint | ✅ success | 1m 20s |
| typecheck | ✅ success | 2m 10s |
| unit-test | ✅ success | 3m 00s |
| build | ✅ success | 2m 30s |

### 다음 단계
- PR 생성 또는 머지 진행 가능
```

### 실패 시
```
## CI 실행 결과: FAILURE

### 워크플로우 정보
- **Run ID**: 12345678
- **Branch**: feature/xxx
- **Commit**: abc1234

### 실패한 Job
| Job | Status | Error |
|-----|--------|-------|
| unit-test | ❌ failure | Test failed: ... |

### 실패 로그 요약
[실패 로그 핵심 내용]

### 다음 단계
- `ci-fix` skill을 사용하여 오류 수정 필요
```

## 주의사항
- push 실패 시 네트워크 오류인 경우 재시도합니다 (최대 4회, 지수 백오프)
- 워크플로우가 30분 이상 실행되면 타임아웃으로 처리합니다
- 여러 워크플로우가 동시에 실행되는 경우 모두 완료될 때까지 대기합니다
- `in_progress` 상태의 워크플로우가 있으면 완료까지 대기합니다
