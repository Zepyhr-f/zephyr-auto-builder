#!/usr/bin/env bash
set -euo pipefail

# 运行数据库迁移
# 用法: ./scripts/migrate.sh [upgrade|downgrade|...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 先开 SSH 隧道
bash "$SCRIPT_DIR/start-tunnel.sh"

cd "$BACKEND_DIR"
. .venv/bin/activate

ACTION="${1:-upgrade}"
echo "执行迁移: alembic ${ACTION} head"
python -m alembic "${ACTION}" head
