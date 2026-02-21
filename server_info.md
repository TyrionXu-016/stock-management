## 服务器
IP: 114.55.139.240
username: root
password: Yung1234.

## MySQL 数据库
Host: 114.55.139.240
Port: 3306
Username: stock_user
Password: Stock@2024

### 说明
- MySQL 8.0.27 运行在 Docker 容器中
- 容器名称：mysql-quick
- 镜像：mysql:8.0
- 用户 stock_user 已创建，可远程访问（Host: %），拥有所有权限
- Root 密码（容器内）：your_password

### 连接测试命令
```bash
# 远程连接
mysql -h 114.55.139.240 -P 3306 -u stock_user -pStock@2024

# 服务器上通过容器连接
docker exec -it mysql-quick mysql -u stock_user -pStock@2024
```

### 管理命令
```bash
# 启动 MySQL 容器
docker start mysql-quick

# 停止 MySQL 容器
docker stop mysql-quick

# 重启 MySQL 容器
docker restart mysql-quick

# 查看容器状态
docker ps -a | grep mysql

# 进入 MySQL 命令行（root）
docker exec -it mysql-quick mysql -u root -pyour_password
```
