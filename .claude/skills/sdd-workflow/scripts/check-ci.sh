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
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# gh CLI 설치 (없는 경우)
install_gh_cli() {
    if command -v gh &> /dev/null; then
        log_info "GitHub CLI already installed: $(gh --version | head -1)"
        return 0
    fi

    log_info "Installing GitHub CLI..."

    # OS 감지
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
                && sudo mkdir -p -m 755 /etc/apt/keyrings \
                && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
                && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
                && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
                && sudo apt update \
                && sudo apt install gh -y
        elif command -v yum &> /dev/null; then
            # RHEL/CentOS/Fedora
            sudo dnf install 'dnf-command(config-manager)' -y 2>/dev/null || true
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo -y 2>/dev/null || \
                sudo yum-config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            sudo dnf install gh -y 2>/dev/null || sudo yum install gh -y
        elif command -v pacman &> /dev/null; then
            # Arch Linux
            sudo pacman -S github-cli --noconfirm
        else
            # Fallback: 바이너리 직접 다운로드
            install_gh_binary
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gh
        else
            install_gh_binary
        fi
    else
        install_gh_binary
    fi

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

# 저장소 정보 가져오기
get_repo_info() {
    local remote_url=$(git remote get-url origin 2>/dev/null)

    if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        echo "${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    else
        log_error "Could not determine GitHub repository from remote URL: $remote_url"
        exit 1
    fi
}

# 최신 워크플로우 실행 가져오기
get_latest_run() {
    local branch=$(git branch --show-current)
    gh run list --branch "$branch" --limit 1 --json databaseId,status,conclusion,headBranch,displayTitle \
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
    # gh CLI 설치 및 인증
    install_gh_cli
    setup_gh_auth

    # 잠시 대기 (워크플로우 시작 대기)
    log_info "Waiting for workflow to start..."
    sleep 10

    local run_info=$(get_latest_run)

    if [ -z "$run_info" ] || [ "$run_info" = "null" ]; then
        log_warn "No workflow run found. Waiting longer..."
        sleep 20
        run_info=$(get_latest_run)
    fi

    if [ -z "$run_info" ] || [ "$run_info" = "null" ]; then
        log_error "No workflow run found for current branch"
        exit 1
    fi

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
