#!/bin/bash
# CI 상태 확인 스크립트
# @spec INFRA-001

set -e

MAX_WAIT_TIME=600  # 최대 10분 대기
CHECK_INTERVAL=30  # 30초 간격으로 확인
MAX_RETRIES=3

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# GitHub CLI 확인
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Run 'gh auth login'"
        exit 1
    fi
}

# 최신 워크플로우 실행 가져오기
get_latest_run() {
    gh run list --limit 1 --json databaseId,status,conclusion,headBranch,displayTitle \
        --jq '.[0]'
}

# 워크플로우 완료 대기
wait_for_completion() {
    local run_id=$1
    local elapsed=0

    log_info "Waiting for workflow run #$run_id to complete..."

    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        local status=$(gh run view "$run_id" --json status --jq '.status')

        if [ "$status" = "completed" ]; then
            local conclusion=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
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

# 실패 로그 출력
show_failure_logs() {
    local run_id=$1
    log_error "Workflow failed. Showing failed job logs:"
    gh run view "$run_id" --log-failed 2>/dev/null || \
        gh run view "$run_id" --log 2>/dev/null | tail -100
}

# 메인 실행
main() {
    check_gh_cli

    # 잠시 대기 (워크플로우 시작 대기)
    log_info "Waiting for workflow to start..."
    sleep 10

    local run_info=$(get_latest_run)
    local run_id=$(echo "$run_info" | jq -r '.databaseId')
    local title=$(echo "$run_info" | jq -r '.displayTitle')
    local branch=$(echo "$run_info" | jq -r '.headBranch')

    log_info "Found workflow run #$run_id"
    log_info "Title: $title"
    log_info "Branch: $branch"

    local result=$(wait_for_completion "$run_id")

    case "$result" in
        "success")
            log_info "Workflow completed successfully!"
            exit 0
            ;;
        "failure")
            log_error "Workflow failed!"
            show_failure_logs "$run_id"
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
