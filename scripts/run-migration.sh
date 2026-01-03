#!/bin/bash
# Run database migrations
# Usage: ./scripts/run-migration.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
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

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
    esac
done

cd "$PROJECT_ROOT/packages/backend"

if [ "$DRY_RUN" = true ]; then
    log_info "Running migration status check (dry-run)..."
    npx prisma migrate status
else
    log_info "Running database migrations..."
    npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        log_info "Migrations completed successfully!"
    else
        log_error "Migration failed!"
        exit 1
    fi
fi

log_info "Current migration status:"
npx prisma migrate status
