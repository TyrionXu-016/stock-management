# 库存管理 - 后端服务

Django 后端，配合库存管理微信小程序使用。

## 环境

- Python 3.8+
- MySQL 8.0+

## 安装

已配置全局 pip 使用清华镜像（`~/.pip/pip.conf`），安装会更快：

```bash
# 激活虚拟环境
source venv/bin/activate  # Linux/macOS

# 安装依赖
pip install -r requirements.txt
```

## 配置

数据库连接信息见项目根目录 `server_info.md`（由 `server_info.example.md` 复制后填写）。

环境变量：

- `DB_HOST` - 数据库主机
- `DB_PORT` - 默认 3306
- `DB_NAME` - 默认 stock_manager
- `DB_USER` - 数据库用户名
- `DB_PASSWORD` - 数据库密码

## 运行

```bash
# 数据库迁移
python manage.py migrate

# 启动开发服务器
python manage.py runserver
```
