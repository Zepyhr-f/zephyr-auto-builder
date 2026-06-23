#!/usr/bin/env bash
set -euo pipefail

# 启动前端开发服务器
# 用法: ./scripts/start-frontend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

cd "$FRONTEND_DIR"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
  echo "安装依赖..."
  npm install
fi

echo "启动前端服务 http://localhost:5173 ..."
npm run dev
