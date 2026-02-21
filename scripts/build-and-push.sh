#!/bin/bash
# 构建并推送 Docker 镜像
# 用法: ./scripts/build-and-push.sh [镜像标签]
# 示例: ./scripts/build-and-push.sh your-registry/stock-manager-backend:v1.0

set -e

IMAGE_NAME="${1:-stock-manager-backend:latest}"

echo "构建镜像: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" .

echo ""
echo "构建完成。推送命令："
echo "  docker push $IMAGE_NAME"
