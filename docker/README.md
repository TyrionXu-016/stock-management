# Docker 部署说明

## 构建镜像

```bash
# 在项目根目录执行
docker build -t stock-manager-backend:latest .
```

## 推送镜像

```bash
# 登录镜像仓库（以 Docker Hub 为例）
docker login

# 打标签（替换 your-registry/your-repo 为实际仓库地址）
docker tag stock-manager-backend:latest your-registry/stock-manager-backend:latest

# 推送
docker push your-registry/stock-manager-backend:latest
```

## 运行容器

### 1. 配置 .env

复制 `backend/.env.example` 为 `backend/.env`，填写数据库、微信、JWT 等配置。

### 2. 启动

```bash
docker run -d \
  --name stock-manager \
  -p 8800:8800 \
  -e GIT_REPO=https://github.com/TyrionXu-016/stock-management.git \
  -e GIT_BRANCH=main \
  -v $(pwd)/backend/.env:/app/backend/.env \
  stock-manager-backend:latest
```

### 3. 若未挂载 .env

首次运行时会自动从 `.env.example` 生成 `.env`，需进入容器手动编辑后重启：

```bash
docker exec -it stock-manager bash
vi /app/backend/.env   # 或使用 cat /app/backend/.env 查看路径后挂载
exit
docker restart stock-manager
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| GIT_REPO | 是 | 代码仓库地址（支持 HTTPS） |
| GIT_BRANCH | 否 | 分支名，默认 `main` |

## 端口

后端服务监听 **8800**，映射时使用 `-p 8800:8800`。
