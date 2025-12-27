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

    if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
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

# GitHub API로 워크플로우 조회 (gh CLI 없이)
get_latest_run_api() {
    local repo=$1
    local branch=$2
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    if [ -z "$token" ]; then
        log_error "No GITHUB_TOKEN or GH_TOKEN found"
        return 1
    fi

    curl -s -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${repo}/actions/runs?branch=${branch}&per_page=1" \
        | jq -r '.workflow_runs[0] | {id: .id, status: .status, conclusion: .conclusion, name: .name}'
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

# 워크플로우 완료 대기 (API 사용)
wait_for_completion_api() {
    local repo=$1
    local run_id=$2
    local elapsed=0
    local token="${GITHUB_TOKEN:-$GH_TOKEN}"

    log_info "Waiting for workflow run #$run_id to complete..."

    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        local response=$(curl -s -H "Authorization: token $token" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${repo}/actions/runs/${run_id}")

        local status=$(echo "$response" | jq -r '.status')

        if [ "$status" = "completed" ]; then
            local conclusion=$(echo "$response" | jq -r '.conclusion')
            echo "$conclusion"
            return 0
        fi

        log_info "Status: $status (elapsed: ${elapsed}s)"
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

    if [ -z "$repo" ]; then
        log_error "Could not determine GitHub repository."
        log_error "Set GITHUB_REPOSITORY environment variable (e.g., owner/repo)"
        exit 1
    fi

    log_info "GitHub repository: $repo"
    log_info "Branch: $branch"

    # gh CLI 설치 및 인증
    install_gh_cli
    setup_gh_auth

    # gh CLI에 저장소 설정
    export GH_REPO="$repo"

    # 잠시 대기 (워크플로우 시작 대기)
    log_info "Waiting for workflow to start..."
    sleep 10

    local run_info=$(get_latest_run_api "$repo" "$branch")

    if [ -z "$run_info" ] || [ "$run_info" = "null" ] || [ "$(echo "$run_info" | jq -r '.id')" = "null" ]; then
        log_warn "No workflow run found. Waiting longer..."
        sleep 20
        run_info=$(get_latest_run_api "$repo" "$branch")
    fi

    if [ -z "$run_info" ] || [ "$run_info" = "null" ] || [ "$(echo "$run_info" | jq -r '.id')" = "null" ]; then
        log_error "No workflow run found for branch: $branch"
        exit 1
    fi

    local run_id=$(echo "$run_info" | jq -r '.id')
    local run_name=$(echo "$run_info" | jq -r '.name')
    local run_status=$(echo "$run_info" | jq -r '.status')

    log_info "Found workflow run #$run_id"
    log_info "Name: $run_name"
    log_info "Current status: $run_status"

    local result=$(wait_for_completion_api "$repo" "$run_id")

    case "$result" in
        "success")
            log_info "Workflow completed successfully!"
            exit 0
            ;;
        "failure")
            log_error "Workflow failed!"
            echo "" >&2
            show_workflow_jobs "$repo" "$run_id"
            log_error "Full logs: https://github.com/$repo/actions/runs/$run_id"
            exit 1
            ;;
        "timeout")
            log_error "Workflow timed out"
            exit 2
            ;;
        *)
            log_error "Unknown result: $result"
            exit 3
            ;;
    esac
}

main "$@"
