## 服务器
IP: <服务器IP>
username: root
password: <密码>

## MySQL 数据库
Host: <数据库主机>
Port: 3306
Username: stock_user
Password: <数据库密码>

### 说明
- 复制此文件为 `server_info.md` 并填写实际连接信息
- `server_info.md` 已加入 .gitignore，不会提交到仓库

### 连接测试命令
```bash
mysql -h <Host> -P 3306 -u stock_user -p<Password>
```
