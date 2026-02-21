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

数据库连接信息见项目根目录 [server_info.md](../server_info.md)。

可选环境变量（或使用默认值）：

- `DB_HOST` - 默认 114.55.139.240
- `DB_PORT` - 默认 3306
- `DB_NAME` - 默认 stock_manager
- `DB_USER` - 默认 stock_user
- `DB_PASSWORD` - 默认 Stock@2024

## 运行

```bash
# 数据库迁移
python manage.py migrate

# 启动开发服务器
python manage.py runserver
```
