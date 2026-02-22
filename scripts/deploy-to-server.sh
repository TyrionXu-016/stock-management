#!/bin/bash
# 部署后端到服务器（直接上传文件，本地构建镜像避免服务器拉取超时）
# 用法: SSHPASS='密码' ./scripts/deploy-to-server.sh

set -e

DEPLOY_HOST="${DEPLOY_HOST:-114.55.139.240}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/stock-manager}"
CONTAINER_NAME="stock-manager"
IMAGE_NAME="stock-manager-backend:latest"
BACKEND_PORT=8800

SCP_CMD="scp"
SSH_CMD="ssh"
RSYNC_CMD="rsync"
if [ -n "${SSHPASS:-}" ]; then
  SCP_CMD="sshpass -e scp"
  SSH_CMD="sshpass -e ssh"
  RSYNC_CMD="sshpass -e rsync"
  export SSHPASS
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "===== 部署到服务器 $DEPLOY_USER@$DEPLOY_HOST（文件直传）====="

# 0. 构建镜像（默认本地构建；DEPLOY_BUILD_REMOTE=1 则在服务器构建）
BUILD_REMOTE="${DEPLOY_BUILD_REMOTE:-0}"
if [ "$BUILD_REMOTE" = "1" ]; then
  echo ">>> 将在服务器上构建镜像"
else
  echo ">>> 本地构建 Docker 镜像..."
  if ! docker build -f "$PROJECT_ROOT/Dockerfile.deploy" -t "$IMAGE_NAME" "$PROJECT_ROOT" 2>/dev/null; then
    echo "本地构建失败（可能 Docker Hub 超时），尝试在服务器构建..."
    BUILD_REMOTE=1
  fi
fi

# 1. 上传 .env
LOCAL_ENV="$PROJECT_ROOT/backend/.env"
if [ -f "$LOCAL_ENV" ]; then
  echo ">>> 上传 .env"
  TMP_ENV=$(mktemp)
  sed 's/^DB_HOST=.*/DB_HOST=host.docker.internal/' "$LOCAL_ENV" > "$TMP_ENV"
  $SCP_CMD -o StrictHostKeyChecking=no "$TMP_ENV" "$DEPLOY_USER@$DEPLOY_HOST:/tmp/stock-manager.env"
  rm -f "$TMP_ENV"
  USE_LOCAL_ENV=true
else
  USE_LOCAL_ENV=false
  echo "本地 .env 不存在，将在服务器从模板创建"
fi

# 2. 上传镜像到服务器（仅当本地已构建时）
if [ "$BUILD_REMOTE" != "1" ]; then
  echo ">>> 上传镜像到服务器..."
  docker save "$IMAGE_NAME" | $SSH_CMD -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" "docker load"
fi

# 3. 上传项目文件
echo ">>> 上传项目文件..."
$RSYNC_CMD -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  --exclude '.git' \
  --exclude 'backend/venv' \
  --exclude 'backend/__pycache__' \
  --exclude 'backend/.env' \
  --exclude '**/__pycache__' \
  --exclude 'node_modules' \
  --exclude '/pages' \
  --exclude '/components' \
  --exclude '/utils' \
  --exclude '/store' \
  --exclude '/assets' \
  --exclude '/api' \
  --exclude 'project.config.json' \
  --exclude 'app.js' \
  --exclude 'app.json' \
  --exclude 'app.wxss' \
  --exclude 'sitemap.json' \
  --exclude 'project.config.json' \
  "$PROJECT_ROOT/" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/"

# 4. 远程执行启动
$SSH_CMD -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" \
  USE_LOCAL_ENV="$USE_LOCAL_ENV" \
  DEPLOY_DIR="$DEPLOY_DIR" \
  CONTAINER_NAME="$CONTAINER_NAME" \
  IMAGE_NAME="$IMAGE_NAME" \
  BACKEND_PORT="$BACKEND_PORT" \
  DEPLOY_HOST="$DEPLOY_HOST" \
  BUILD_REMOTE="$BUILD_REMOTE" \
  bash -s << 'ENDSSH'
set -e

cd "$DEPLOY_DIR"

echo ">>> 准备 .env"
mkdir -p "$DEPLOY_DIR/backend"
if [ "$USE_LOCAL_ENV" = "true" ] && [ -f /tmp/stock-manager.env ]; then
  mv /tmp/stock-manager.env "$DEPLOY_DIR/backend/.env"
else
  [ -f "$DEPLOY_DIR/backend/.env" ] || cp "$DEPLOY_DIR/backend/.env.example" "$DEPLOY_DIR/backend/.env"
  sed -i 's/^DB_HOST=.*/DB_HOST=host.docker.internal/' "$DEPLOY_DIR/backend/.env"
  sed -i 's/^DB_PORT=.*/DB_PORT=3306/' "$DEPLOY_DIR/backend/.env"
  sed -i 's/^DB_NAME=.*/DB_NAME=stock_manager/' "$DEPLOY_DIR/backend/.env"
  sed -i 's/^DB_USER=.*/DB_USER=stock_user/' "$DEPLOY_DIR/backend/.env"
  sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Stock@2024/' "$DEPLOY_DIR/backend/.env"
  echo "已写入默认数据库配置"
fi

if [ "$BUILD_REMOTE" = "1" ]; then
  echo ">>> 在服务器构建 Docker 镜像..."
  docker build -f "$DEPLOY_DIR/Dockerfile.deploy" -t "$IMAGE_NAME" "$DEPLOY_DIR"
fi

echo ">>> 停止并移除旧容器"
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo ">>> 配置网络（与 MySQL 容器互通）"
docker network create stock-net 2>/dev/null || true
docker network connect stock-net mysql-quick 2>/dev/null || true

echo ">>> 执行数据库迁移（cover_image 等）"
docker exec mysql-quick mysql -u stock_user -pStock@2024 stock_manager -e "ALTER TABLE t_product ADD COLUMN cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL' AFTER max_stock;" 2>/dev/null || true

echo ">>> 创建 media 目录（图片上传持久化）"
mkdir -p "$DEPLOY_DIR/backend/media"

echo ">>> 启动容器"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --network stock-net \
  -p "$BACKEND_PORT":8800 \
  -e DB_HOST=mysql-quick \
  -v "$DEPLOY_DIR/backend/.env:/app/.env" \
  -v "$DEPLOY_DIR/backend/media:/app/media" \
  "$IMAGE_NAME"

echo ">>> 等待服务启动..."
sleep 5
docker logs --tail 25 "$CONTAINER_NAME"

echo ""
echo "===== 部署完成 ====="
echo "后端服务: http://$DEPLOY_HOST:$BACKEND_PORT"
ENDSSH

echo ""
echo "部署完成。后端地址: http://$DEPLOY_HOST:$BACKEND_PORT"
