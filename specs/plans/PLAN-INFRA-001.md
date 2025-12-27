# PLAN-INFRA-001: GitHub Actions CI/CD 워크플로우 구현

## 메타데이터
- **ID**: PLAN-INFRA-001
- **작성일**: 2025-12-27
- **관련 명세**: INFRA-001
- **예상 파일 변경**: 3개

## 목표
INFRA-001 명세에 따라 GitHub Actions CI/CD 파이프라인을 구현합니다.
현재 기본 ci.yml을 강화하고, integration.yml 워크플로우를 추가합니다.

## 작업 분할

### 1단계: CI 워크플로우 강화 (ci.yml)
- [ ] detect-changes job 추가 (변경된 패키지 감지)
- [ ] lint job 분리 (ESLint)
- [ ] typecheck job 분리 (TypeScript)
- [ ] unit-test job 추가 (Jest)
- [ ] 캐시 전략 강화 (Turborepo, pnpm)
- [ ] Matrix 전략 적용 (frontend, backend, shared)

**예상 변경 파일:**
- `.github/workflows/ci.yml` - 전체 구조 개선

### 2단계: Integration 워크플로우 추가 (integration.yml)
- [ ] PostgreSQL 서비스 컨테이너 설정
- [ ] Prisma 마이그레이션 테스트
- [ ] API 통합 테스트 준비
- [ ] workflow_dispatch 트리거 추가

**예상 변경 파일:**
- `.github/workflows/integration.yml` - 새 파일 생성

### 3단계: 추적성 매트릭스 업데이트
- [ ] INFRA-001 상태를 ✅ 완료로 변경
- [ ] 구현 파일 경로 업데이트
- [ ] 변경 이력 추가

**예상 변경 파일:**
- `specs/TRACEABILITY.md` - 상태 업데이트

## 검증 방법
- [ ] ci.yml 워크플로우 구문 검증 (yamllint)
- [ ] integration.yml 워크플로우 구문 검증
- [ ] Push 후 CI 자동 실행 확인
- [ ] 모든 job 성공 확인

## 의존성
- 선행 조건: FEAT-001 (모노레포 구조) - 완료
- 영향 범위: 모든 PR 및 push 이벤트에 영향

## 롤백 계획
기존 ci.yml을 git revert로 복원

## 범위 제외 (추후 구현)
- docker.yml: 프로덕션 준비 시 구현
- release.yml: 첫 릴리즈 시 구현
- REQ-5 Quality Gates: 테스트 코드 작성 후 구현

---

## 진행 상태
- [x] 1단계: CI 워크플로우 강화
- [x] 2단계: Integration 워크플로우 추가
- [x] 3단계: 추적성 매트릭스 업데이트
