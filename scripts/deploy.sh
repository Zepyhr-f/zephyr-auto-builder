#!/usr/bin/env bash
set -euo pipefail

# Docker 部署
# 用法: ./scripts/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 检查 .env
if [ ! -f ".env" ]; then
  echo "错误: .env 文件不存在，请从 .env.example 复制并配置"
  exit 1
fi

echo "构建并启动 Docker 容器..."
docker compose up --build -d

echo ""
echo "服务已启动："
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo ""
echo "查看日志: docker compose logs -f"
echo "停止服务: docker compose down"
