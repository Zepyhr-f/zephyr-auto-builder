#!/usr/bin/env bash
set -euo pipefail

# 停止 Docker 部署
# 用法: ./scripts/stop.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "停止 Docker 容器..."
docker compose down
echo "已停止"
