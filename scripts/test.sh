#!/usr/bin/env bash
set -euo pipefail

# 运行后端测试
# 用法: ./scripts/test.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"
. .venv/bin/activate

echo "运行测试..."
python -m pytest tests/ -v
