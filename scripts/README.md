# Scripts

项目启动、部署和测试脚本。

## 脚本说明

| 脚本 | 作用 |
|------|------|
| `start-tunnel.sh` | 建立 SSH 隧道，将远程 PostgreSQL 5432 端口转发到本地 15432 |
| `start-backend.sh` | 启动后端服务（FastAPI + Uvicorn），端口 8000 |
| `start-frontend.sh` | 启动前端开发服务器（Vite + React），端口 5173 |
| `start-dev.sh` | 一键启动：SSH 隧道 + 后端 + 前端（后台运行） |
| `migrate.sh` | 运行 Alembic 数据库迁移 |
| `test.sh` | 运行后端全部测试 |
| `deploy.sh` | 通过 Docker Compose 构建并部署前后端 |
| `stop.sh` | 停止所有后台进程（后端、前端、隧道） |

## 快速开始

### 一键开发模式

```bash
./scripts/start-dev.sh
```

会自动启动 SSH 隧道、后端（8000）和前端（5173），日志输出到 `logs/` 目录。

### 单独启动

```bash
# 1. 先开 SSH 隧道（连接远程 PostgreSQL）
./scripts/start-tunnel.sh

# 2. 启动后端
./scripts/start-backend.sh

# 3. 启动前端
./scripts/start-frontend.sh
```

### 数据库迁移

```bash
./scripts/migrate.sh
```

### 运行测试

```bash
./scripts/test.sh
```

### Docker 部署

```bash
./scripts/deploy.sh
```

### 停止所有服务

```bash
./scripts/stop.sh
```

## 端口

| 服务 | 端口 | 说明 |
|------|------|------|
| SSH 隧道 | 15432 | 转发到远程 PostgreSQL |
| 后端 API | 8000 | FastAPI 服务 |
| 前端 | 5173 | Vite 开发服务器 |

## 日志

日志文件保存在 `logs/` 目录：

- `logs/backend.log` - 后端日志
- `logs/frontend.log` - 前端日志
- `logs/tunnel.log` - SSH 隧道日志
