#!/usr/bin/env bash
set -euo pipefail

# 启动后端开发服务器
# 用法: ./scripts/start-backend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 先开 SSH 隧道
bash "$SCRIPT_DIR/start-tunnel.sh"

# 检查虚拟环境
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "虚拟环境不存在，正在创建..."
  cd "$BACKEND_DIR"
  python3.12 -m venv .venv
  . .venv/bin/activate
  pip install -e '.[dev]'
else
  cd "$BACKEND_DIR"
  . .venv/bin/activate
fi

echo "启动后端服务 http://localhost:8000 ..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
