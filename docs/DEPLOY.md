# 服务器部署说明

## 前提条件

- 服务器已安装 Docker
- 若 Docker Hub 超时：服务器需配置镜像加速（`/etc/docker/daemon.json` 的 `registry-mirrors`）
- 本地可通过 SSH 连接服务器（建议配置密钥免密）
- 服务器已运行 MySQL（如 server_info.md 中的 mysql-quick 容器）

## 一键部署

在项目根目录执行：

```bash
chmod +x scripts/deploy-to-server.sh
SSHPASS='密码' ./scripts/deploy-to-server.sh
```

脚本会：

1. 本地构建镜像（失败则自动改在服务器构建）
2. 上传 .env 和项目文件到服务器
3. 上传镜像（或服务器构建）
4. 启动容器，端口 8800

若本地 Docker Hub 超时，可强制在服务器构建：

```bash
DEPLOY_BUILD_REMOTE=1 SSHPASS='密码' ./scripts/deploy-to-server.sh
```

## 配置说明

可通过环境变量覆盖默认配置：

```bash
DEPLOY_HOST=114.55.139.240 \
DEPLOY_USER=root \
./scripts/deploy-to-server.sh
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DEPLOY_HOST | 114.55.139.240 | 服务器 IP |
| DEPLOY_USER | root | SSH 用户 |
| DEPLOY_DIR | /opt/stock-manager | 服务器部署目录 |
| GIT_REPO | https://github.com/... | 代码仓库 |
| GIT_BRANCH | main | 分支名 |

## 首次部署无本地 .env 时

脚本会在服务器生成 `backend/.env`，使用默认数据库配置。需手动登录服务器补充微信、JWT 等：

```bash
ssh root@114.55.139.240
vi /opt/stock-manager/backend/.env   # 填写 WECHAT_APPID, WECHAT_SECRET, JWT_SECRET_KEY
docker restart stock-manager
```

## 常用命令

```bash
# 查看日志
ssh root@114.55.139.240 'docker logs -f stock-manager'

# 重启容器
ssh root@114.55.139.240 'docker restart stock-manager'

# 进入容器
ssh root@114.55.139.240 'docker exec -it stock-manager bash'
```

## 访问地址

部署完成后：`http://114.55.139.240:8800`
