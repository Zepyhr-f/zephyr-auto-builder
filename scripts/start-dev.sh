#!/usr/bin/env bash
set -euo pipefail

# 同时启动前后端开发服务器
# 用法: ./scripts/start-dev.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Hermes Orchestrator 开发环境 ==="
echo ""

# 启动后端（后台）
bash "$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

# 启动前端
bash "$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

echo ""
echo "前端: http://localhost:5173"
echo "后端: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo ""

# 捕获退出信号
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# 等待
wait
