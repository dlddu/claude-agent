---
name: project-bootstrap
description: >
  요구사항 명세를 기반으로 프로젝트 구조와 CI 파이프라인을 설정합니다.
  "프로젝트 초기화해줘", "프로젝트 부트스트랩", "CI 설정해줘", "프로젝트 구조 만들어줘" 등을 요청할 때 활성화됩니다.
---

# 프로젝트 부트스트랩 스킬 (Project Bootstrap Skill)

## 개요

이 스킬은 요구사항 명세서를 기반으로 프로젝트의 아키텍처를 설계하고, GitHub Actions를 사용한 CI 파이프라인을 구성합니다.
Hello World 수준의 기본 구현과 Health Check 엔드포인트를 포함하여 CI가 정상 동작하는 것을 검증합니다.

## 실행 조건

다음과 같은 요청 시 이 스킬이 활성화됩니다:
- "프로젝트 초기화해줘"
- "프로젝트 부트스트랩"
- "CI 설정해줘"
- "프로젝트 구조 만들어줘"
- "새 프로젝트 시작"

## 사전 조건

- `docs/specs/` 디렉토리에 명세서가 존재해야 합니다
- `docs/user-stories/` 디렉토리에 사용자 스토리가 존재해야 합니다

## 작업 흐름

### Phase 1: 명세 분석 및 기술 스택 결정

1. **명세서 분석**
   ```
   docs/specs/*.md 파일들을 분석하여:
   - 필요한 기술 스택 파악
   - 시스템 구성 요소 식별
   - 통합 포인트 확인
   ```

2. **기술 스택 결정**
   - 프로그래밍 언어 및 프레임워크
   - 데이터베이스 (필요시)
   - 외부 서비스 연동
   - 테스트 프레임워크

### Phase 2: 아키텍처 설계

**파일 위치**: `docs/architecture/ARCHITECTURE.md`

**아키텍처 문서 템플릿**:

```markdown
# 시스템 아키텍처

## 메타데이터
- **버전**: 1.0.0
- **작성일**: {날짜}
- **관련 명세**: SPEC-{번호} 목록

## 1. 시스템 개요

### 1.1 아키텍처 다이어그램
{시스템 구성도 - Mermaid 또는 ASCII}

### 1.2 기술 스택
| 구분 | 기술 | 버전 | 선정 이유 |
|-----|-----|-----|---------|
| Language | {언어} | {버전} | {이유} |
| Framework | {프레임워크} | {버전} | {이유} |
| Test | {테스트 도구} | {버전} | {이유} |
| CI/CD | GitHub Actions | - | 표준화된 CI/CD |

## 2. 컴포넌트 구조

### 2.1 디렉토리 구조
```
{프로젝트 루트}/
├── src/                    # 소스 코드
│   ├── main/              # 메인 애플리케이션
│   └── test/              # 테스트 코드
├── docs/                   # 문서
│   ├── specs/             # 명세서
│   ├── user-stories/      # 사용자 스토리
│   └── architecture/      # 아키텍처 문서
├── .github/
│   └── workflows/         # CI/CD 워크플로우
└── {설정 파일들}
```

### 2.2 모듈 설명
| 모듈명 | 역할 | 의존성 |
|-------|-----|-------|
| {모듈} | {역할} | {의존성} |

## 3. 인터페이스 정의

### 3.1 API 엔드포인트
| Method | Path | 설명 | 관련 스토리 |
|--------|------|-----|-----------|
| GET | /health | 헬스 체크 | - |
| {Method} | {Path} | {설명} | US-{번호} |

## 4. 추적성
- **관련 명세**: {SPEC ID 목록}
- **관련 스토리**: {US ID 목록}
```

### Phase 3: CI 파이프라인 설계

**파일 위치**: `.github/workflows/ci.yml`

**CI 파이프라인 템플릿**:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  # 환경 변수 정의

jobs:
  # Job 1: 빌드 및 단위 테스트
  build-and-test:
    name: Build & Unit Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup {언어/런타임}
        uses: {setup-action}
        with:
          {version}: {버전}

      - name: Install dependencies
        run: {의존성 설치 명령}

      - name: Run linter
        run: {린트 명령}

      - name: Run unit tests
        run: {테스트 명령}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: {테스트 결과 경로}

  # Job 2: 통합 테스트
  integration-test:
    name: Integration Test
    runs-on: ubuntu-latest
    needs: build-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup environment
        run: {환경 설정}

      - name: Run integration tests
        run: {통합 테스트 명령}

  # Job 3: E2E 테스트 (필요시)
  e2e-test:
    name: E2E Test
    runs-on: ubuntu-latest
    needs: integration-test
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run E2E tests
        run: {E2E 테스트 명령}
```

### Phase 4: Hello World 구현

기본 애플리케이션과 Health Check 엔드포인트를 구현합니다.

**필수 구현 항목**:

1. **메인 애플리케이션**
   - 최소한의 Hello World 기능
   - 정상적으로 빌드되고 실행 가능해야 함

2. **Health Check 엔드포인트**
   ```
   GET /health
   Response: { "status": "healthy", "timestamp": "..." }
   ```

3. **기본 테스트**
   - Health Check 엔드포인트 테스트
   - 애플리케이션 시작 테스트

### Phase 5: CI 검증

1. **로컬 테스트 실행**
   ```bash
   # 빌드 확인
   {빌드 명령}

   # 테스트 실행
   {테스트 명령}

   # 린트 확인
   {린트 명령}
   ```

2. **GitHub Actions 검증**
   - 코드 커밋 및 푸시
   - GitHub Actions 실행 확인
   - 모든 Job이 성공하는지 확인

3. **check-ci.sh 스크립트를 사용한 CI 결과 확인**

   이 스킬에는 CI 상태를 자동으로 확인하는 스크립트가 포함되어 있습니다.

   **스크립트 위치**: `skills/project-bootstrap/scripts/check-ci.sh`

   **사용 방법**:
   ```bash
   # 스크립트 실행 (푸시 후)
   ./scripts/check-ci.sh
   ```

   **스크립트 기능**:
   - 현재 커밋에 대한 모든 워크플로우 상태 조회
   - 모든 워크플로우가 완료될 때까지 대기 (최대 10분)
   - 실패한 워크플로우의 상세 정보 (jobs, steps) 출력
   - 성공/실패 결과 반환

   **필요 환경**:
   - `GITHUB_TOKEN` 또는 `GH_TOKEN` 환경 변수 설정
   - GitHub CLI (자동 설치됨)

   **출력 예시**:
   ```
   [INFO] Checking CI status...
   [INFO] GitHub repository: owner/repo
   [INFO] Branch: main
   [INFO] Commit SHA: abc1234
   [INFO] Found 2 workflow(s) for commit abc1234
   [INFO] Workflows:
     - CI Pipeline (#12345) [in_progress]
     - Lint (#12346) [completed]
   [INFO] Progress: 1 completed, 1 pending (elapsed: 30s)
   [INFO] All workflows completed successfully!
   ```

   **CI 실패 시**:
   ```
   [ERROR] One or more workflows failed!
   [ERROR] Failed workflow: CI Pipeline (#12345)
   ━━━ Job: build [❌ failure] ━━━
     ✅ Checkout code
     ✅ Setup Node.js
     ❌ Run tests
   [ERROR] Full logs: https://github.com/owner/repo/actions/runs/12345
   ```

### Phase 6: 추적성 매트릭스 업데이트

**파일 위치**: `docs/traceability-matrix.md`

```markdown
## 아키텍처 추적성 추가

| 명세서 ID | 아키텍처 컴포넌트 | API 엔드포인트 | 테스트 유형 |
|----------|-----------------|---------------|------------|
| SPEC-{번호} | {컴포넌트명} | {엔드포인트} | Unit/Integration/E2E |
```

## 산출물

이 스킬 실행 후 다음이 생성/구성됩니다:

### 문서
1. `docs/architecture/ARCHITECTURE.md` - 아키텍처 설계 문서

### CI/CD
2. `.github/workflows/ci.yml` - CI 파이프라인

### 소스 코드
3. 기본 프로젝트 구조 및 설정 파일
4. Hello World 메인 애플리케이션
5. Health Check 엔드포인트
6. 기본 테스트 코드

### 추적성
7. `docs/traceability-matrix.md` 업데이트

## 검증 기준

프로젝트 부트스트랩이 완료된 것으로 간주하는 기준:

1. ✅ 로컬에서 빌드 성공
2. ✅ 로컬에서 테스트 통과
3. ✅ Health Check 엔드포인트 응답 확인
4. ✅ GitHub Actions CI 파이프라인 성공
5. ✅ 아키텍처 문서 작성 완료
6. ✅ 추적성 매트릭스 업데이트 완료

## 주의사항

1. **CI 우선**: 코드 작성 전에 CI 파이프라인이 정상 동작하는지 확인합니다.

2. **최소 구현**: Hello World 수준의 최소한의 코드만 작성합니다. 실제 기능 구현은 `implementation` 스킬에서 진행합니다.

3. **테스트 포함**: Health Check에 대한 테스트도 반드시 포함합니다.

4. **문서화**: 아키텍처 결정 사항은 모두 문서로 남깁니다.

## 다음 단계

프로젝트 부트스트랩이 완료되면:
- `task-planning` 스킬로 구체적인 작업 계획 수립
