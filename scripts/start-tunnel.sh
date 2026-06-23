#!/usr/bin/env bash
set -euo pipefail

# 建立 SSH 隧道到远程 PostgreSQL
# 用法: ./scripts/start-tunnel.sh

REMOTE_HOST="81.70.160.181"
REMOTE_USER="ubuntu"
LOCAL_PORT=15432
REMOTE_PORT=5432

echo "正在建立 SSH 隧道 ${LOCAL_PORT} -> ${REMOTE_HOST}:${REMOTE_PORT} ..."

# 检查隧道是否已存在
if lsof -i :${LOCAL_PORT} >/dev/null 2>&1; then
  echo "端口 ${LOCAL_PORT} 已被占用，隧道可能已建立"
  exit 0
fi

ssh -f -N -L ${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}
echo "SSH 隧道已建立 (本地端口 ${LOCAL_PORT})"
