#!/bin/bash
set -e

GIT_REPO="${GIT_REPO:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"

if [ -z "$GIT_REPO" ]; then
  echo "错误: 请设置环境变量 GIT_REPO"
  echo "示例: docker run -e GIT_REPO=https://github.com/xxx/stock-management.git ..."
  exit 1
fi

# 克隆或拉取代码
if [ ! -d /app/.git ]; then
  echo "正在克隆代码 (branch: $GIT_BRANCH)..."
  git clone --depth 1 -b "$GIT_BRANCH" "$GIT_REPO" /app
else
  echo "正在拉取最新代码..."
  cd /app && git pull origin "$GIT_BRANCH"
fi

cd /app/backend

# 安装/更新 Python 依赖
echo "安装依赖..."
pip install -q -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple 2>/dev/null || pip install -q -r requirements.txt

# 若 .env 不存在则从示例创建
if [ ! -f .env ]; then
  cp .env.example .env
  echo "=========================================="
  echo "已创建 .env，请配置后重启容器以启动服务"
  echo "方式1 挂载: -v /path/to/.env:/app/backend/.env"
  echo "方式2 编辑: docker exec -it <容器名> vi /app/backend/.env"
  echo "=========================================="
fi

# 数据库迁移（可选，首次部署时执行）
python manage.py migrate --noinput 2>/dev/null || true

echo "启动后端服务 (端口 8800)..."
exec python manage.py runserver 0.0.0.0:8800
