#!/bin/bash
# CI 상태 확인 스크립트
# @spec INFRA-001

set -e

MAX_WAIT_TIME=600  # 최대 10분 대기
CHECK_INTERVAL=30  # 30초 간격으로 확인

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 저장소 정보 가져오기 (owner/repo)
# 우선순위: GITHUB_REPOSITORY 환경변수 > git remote URL
get_repo_info() {
    # 환경변수가 설정되어 있으면 사용
    if [ -n "$GITHUB_REPOSITORY" ]; then
        echo "$GITHUB_REPOSITORY"
        return 0
    fi

    # git remote에서 추출 시도
    local remote_url=$(git remote get-url origin 2>/dev/null)

    # github.com URL 패턴 (SSH 또는 HTTPS)
    if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        echo "${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        return 0
    fi

    # 프록시 URL 패턴 (예: http://proxy@127.0.0.1:port/git/owner/repo)
    if [[ "$remote_url" =~ /git/([^/]+)/([^/.]+) ]]; then
        echo "${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
        return 0
    fi

    echo ""
    return 1
}

# gh CLI 설치 (없는 경우)
install_gh_cli() {
    if command -v gh &> /dev/null; then
        log_info "GitHub CLI already installed: $(gh --version | head -1)"
        return 0
    fi

    log_info "Installing GitHub CLI..."

    # 바이너리 직접 설치 (가장 안정적)
    install_gh_binary

    if command -v gh &> /dev/null; then
        log_info "GitHub CLI installed successfully: $(gh --version | head -1)"
    else
        log_error "Failed to install GitHub CLI"
        exit 1
    fi
}

# gh 바이너리 직접 설치
install_gh_binary() {
    log_info "Installing gh CLI from binary..."

    local VERSION="2.63.2"
    local ARCH=$(uname -m)
    local OS=$(uname -s | tr '[:upper:]' '[:lower:]')

    case "$ARCH" in
        x86_64) ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        *) log_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    local URL="https://github.com/cli/cli/releases/download/v${VERSION}/gh_${VERSION}_${OS}_${ARCH}.tar.gz"
    local TMP_DIR=$(mktemp -d)

    curl -sL "$URL" | tar xz -C "$TMP_DIR"
    sudo mv "$TMP_DIR/gh_${VERSION}_${OS}_${ARCH}/bin/gh" /usr/local/bin/
    rm -rf "$TMP_DIR"
}

# gh CLI 인증 설정
setup_gh_auth() {
    # 이미 인증되어 있는지 확인
    if gh auth status &> /dev/null; then
        log_info "GitHub CLI already authenticated"
        return 0
    fi

    # GITHUB_TOKEN 환경변수 확인
    if [ -n "$GITHUB_TOKEN" ]; then
        log_info "Authenticating with GITHUB_TOKEN..."
        echo "$GITHUB_TOKEN" | gh auth login --with-token
        return 0
    fi

    # GH_TOKEN 환경변수 확인 (gh CLI 기본 환경변수)
    if [ -n "$GH_TOKEN" ]; then
        log_info "Using GH_TOKEN for authentication"
        return 0
    fi

    log_error "No authentication token found. Set GITHUB_TOKEN or GH_TOKEN environment variable."
    exit 1
}

# GitHub API로 특정 commit에 대한 모든 워크플로우 조회
get_runs_for_commit_api() {
    local repo=$1
    local commit_sha=$2
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    if [ -z "$token" ]; then
        log_error "No GITHUB_TOKEN or GH_TOKEN found"
        return 1
    fi

    curl -s -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${repo}/actions/runs?head_sha=${commit_sha}&per_page=100" \
        | jq -r '.workflow_runs[] | {id: .id, status: .status, conclusion: .conclusion, name: .name}'
}

# 특정 commit에 대한 워크플로우 run ID 목록 조회
get_run_ids_for_commit() {
    local repo=$1
    local commit_sha=$2
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    curl -s -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${repo}/actions/runs?head_sha=${commit_sha}&per_page=100" \
        | jq -r '.workflow_runs[].id'
}

# 워크플로우 jobs 및 steps 조회
show_workflow_jobs() {
    local repo=$1
    local run_id=$2
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    log_info "Fetching workflow jobs and steps..."

    local jobs_response=$(curl -s -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${repo}/actions/runs/${run_id}/jobs")

    local job_count=$(echo "$jobs_response" | jq -r '.total_count')
    log_info "Total jobs: $job_count"
    echo "" >&2

    echo "$jobs_response" | jq -r '.jobs[] | @base64' | while read -r job_b64; do
        local job=$(echo "$job_b64" | base64 -d)
        local job_name=$(echo "$job" | jq -r '.name')
        local job_status=$(echo "$job" | jq -r '.status')
        local job_conclusion=$(echo "$job" | jq -r '.conclusion')

        # Job 상태에 따른 아이콘
        local job_icon="⏳"
        case "$job_conclusion" in
            "success") job_icon="✅" ;;
            "failure") job_icon="❌" ;;
            "skipped") job_icon="⏭️" ;;
            "cancelled") job_icon="🚫" ;;
        esac

        echo -e "${YELLOW}━━━ Job: $job_name [$job_icon $job_conclusion] ━━━${NC}" >&2

        # Steps 출력
        echo "$job" | jq -r '.steps[] | @base64' | while read -r step_b64; do
            local step=$(echo "$step_b64" | base64 -d)
            local step_name=$(echo "$step" | jq -r '.name')
            local step_status=$(echo "$step" | jq -r '.status')
            local step_conclusion=$(echo "$step" | jq -r '.conclusion')

            # Step 상태에 따른 아이콘
            local step_icon="⏳"
            case "$step_conclusion" in
                "success") step_icon="✅" ;;
                "failure") step_icon="❌" ;;
                "skipped") step_icon="⏭️" ;;
                "cancelled") step_icon="🚫" ;;
            esac

            echo -e "  $step_icon $step_name" >&2
        done
        echo "" >&2
    done
}

# 단일 워크플로우 상태 조회
get_workflow_status() {
    local repo=$1
    local run_id=$2
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    curl -s -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${repo}/actions/runs/${run_id}" \
        | jq -r '{id: .id, name: .name, status: .status, conclusion: .conclusion}'
}

# 모든 워크플로우 완료 대기 (API 사용)
wait_for_all_workflows() {
    local repo=$1
    local commit_sha=$2
    local elapsed=0
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    log_info "Waiting for all workflows for commit $commit_sha to complete..."

    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        # 현재 commit에 대한 모든 워크플로우 조회
        local runs_response=$(curl -s -H "Authorization: token $token" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${repo}/actions/runs?head_sha=${commit_sha}&per_page=100")

        local total_count=$(echo "$runs_response" | jq -r '.total_count')

        if [ "$total_count" = "0" ] || [ "$total_count" = "null" ]; then
            log_warn "No workflows found yet... (elapsed: ${elapsed}s)"
            sleep $CHECK_INTERVAL
            elapsed=$((elapsed + CHECK_INTERVAL))
            continue
        fi

        # 각 워크플로우 상태 확인
        local all_completed=true
        local any_failed=false
        local pending_count=0
        local completed_count=0
        local failed_runs=""

        while IFS= read -r run; do
            local run_id=$(echo "$run" | jq -r '.id')
            local run_name=$(echo "$run" | jq -r '.name')
            local run_status=$(echo "$run" | jq -r '.status')
            local run_conclusion=$(echo "$run" | jq -r '.conclusion')

            if [ "$run_status" != "completed" ]; then
                all_completed=false
                pending_count=$((pending_count + 1))
            else
                completed_count=$((completed_count + 1))
                if [ "$run_conclusion" = "failure" ]; then
                    any_failed=true
                    failed_runs="${failed_runs}${run_id}:${run_name}\n"
                fi
            fi
        done < <(echo "$runs_response" | jq -c '.workflow_runs[]')

        log_info "Progress: $completed_count completed, $pending_count pending (elapsed: ${elapsed}s)"

        if [ "$all_completed" = true ]; then
            if [ "$any_failed" = true ]; then
                echo "failure"
                echo -e "$failed_runs" | head -n -1  # 실패한 run 정보 출력 (마지막 빈 줄 제외)
            else
                echo "success"
            fi
            return 0
        fi

        sleep $CHECK_INTERVAL
        elapsed=$((elapsed + CHECK_INTERVAL))
    done

    log_error "Timeout waiting for workflow completion"
    echo "timeout"
    return 1
}

# 메인 실행
main() {
    log_info "Checking CI status..."

    local repo=$(get_repo_info)
    local branch=$(git branch --show-current)
    local commit_sha=$(git rev-parse HEAD)

    if [ -z "$repo" ]; then
        log_error "Could not determine GitHub repository."
        log_error "Set GITHUB_REPOSITORY environment variable (e.g., owner/repo)"
        exit 1
    fi

    log_info "GitHub repository: $repo"
    log_info "Branch: $branch"
    log_info "Commit SHA: $commit_sha"

    # gh CLI 설치 및 인증
    install_gh_cli
    setup_gh_auth

    # gh CLI에 저장소 설정
    export GH_REPO="$repo"

    # 잠시 대기 (워크플로우 시작 대기)
    log_info "Waiting for workflows to start..."
    sleep 10

    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    # 해당 commit에 대한 워크플로우 조회
    local runs_response=$(curl -s -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${repo}/actions/runs?head_sha=${commit_sha}&per_page=100")

    local workflow_count=$(echo "$runs_response" | jq -r '.total_count')

    if [ "$workflow_count" = "0" ] || [ "$workflow_count" = "null" ]; then
        log_warn "No workflow runs found. Waiting longer..."
        sleep 20
        runs_response=$(curl -s -H "Authorization: token $token" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${repo}/actions/runs?head_sha=${commit_sha}&per_page=100")
        workflow_count=$(echo "$runs_response" | jq -r '.total_count')
    fi

    if [ "$workflow_count" = "0" ] || [ "$workflow_count" = "null" ]; then
        log_error "No workflow runs found for commit: $commit_sha"
        exit 1
    fi

    log_info "Found $workflow_count workflow(s) for commit $commit_sha"

    # 워크플로우 목록 출력
    echo "" >&2
    log_info "Workflows:"
    echo "$runs_response" | jq -r '.workflow_runs[] | "  - \(.name) (#\(.id)) [\(.status)]"' >&2
    echo "" >&2

    # 모든 워크플로우 완료 대기
    local result_output=$(wait_for_all_workflows "$repo" "$commit_sha")
    local result=$(echo "$result_output" | head -n 1)
    local failed_runs=$(echo "$result_output" | tail -n +2)

    case "$result" in
        "success")
            log_info "All workflows completed successfully!"
            exit 0
            ;;
        "failure")
            log_error "One or more workflows failed!"
            echo "" >&2

            # 실패한 각 워크플로우에 대해 jobs 정보 표시
            echo "$failed_runs" | while IFS=':' read -r run_id run_name; do
                if [ -n "$run_id" ]; then
                    log_error "Failed workflow: $run_name (#$run_id)"
                    show_workflow_jobs "$repo" "$run_id"
                    log_error "Full logs: https://github.com/$repo/actions/runs/$run_id"
                    echo "" >&2
                fi
            done
            exit 1
            ;;
        "timeout")
            log_error "Timeout waiting for workflows to complete"
            exit 2
            ;;
        *)
            log_error "Unknown result: $result"
            exit 3
            ;;
    esac
}

main "$@"
