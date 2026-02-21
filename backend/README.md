# 库存管理 - 后端服务

Django 后端，配合库存管理微信小程序使用。

## 环境

- Python 3.8+
- MySQL 8.0+

## 安装

```bash
# 激活虚拟环境
source venv/bin/activate  # Linux/macOS

# 安装依赖
pip install -r requirements.txt
```

## 配置

1. **初始化数据库**（首次运行）：在项目根目录执行 `database/schema.sql` 创建库和表：
   ```bash
   mysql -h <Host> -P 3306 -u <Username> -p<Password> < ../database/schema.sql
   ```
   连接信息见项目根目录 `server_info.md`。

2. **环境变量**：复制 `.env.example` 为 `.env`，或直接设置：
   - `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_USER`、`DB_PASSWORD` - 数据库连接
   - `WECHAT_APPID`、`WECHAT_SECRET` - 微信小程序 AppID 和 AppSecret（登录接口必需）
   - `JWT_SECRET_KEY` - JWT 密钥（可选，默认使用 Django SECRET_KEY）

## 运行

```bash
source venv/bin/activate
python manage.py runserver
# 默认 http://127.0.0.1:8000
```

## 接口测试

启动服务后，运行全量测试：

```bash
TOKEN=$(python scripts/get_test_token.py) bash scripts/test_all_apis.sh
```

## 已实现接口

### 第一阶段
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 微信登录（需 code） |
| GET  | /api/user/profile | 获取用户信息（需登录） |
| PUT  | /api/user/profile | 更新用户信息（需登录） |
| GET  | /api/report/overview | 报表概览（需登录） |

### 第二阶段
| 方法 | 路径 | 说明 |
|------|------|------|
| GET    | /api/categories | 分类列表（树形，Query: parent_id） |
| POST   | /api/categories | 创建分类（需登录） |
| PUT    | /api/categories/:id | 更新分类（需登录） |
| DELETE | /api/categories/:id | 删除分类（需管理员） |
| GET    | /api/products | 商品列表（Query: keyword, category_id, status, page, page_size） |
| POST   | /api/products | 创建商品（需登录） |
| GET    | /api/products/:id | 商品详情 |
| PUT    | /api/products/:id | 更新商品（需登录） |
| DELETE | /api/products/:id | 删除商品（需管理员） |

### 第三阶段
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/inbound | 入库单列表（status、start_date、end_date、分页） |
| POST | /api/inbound | 创建入库单（需登录） |
| GET  | /api/inbound/:id | 入库单详情 |
| PUT  | /api/inbound/:id/status | 审批入库单（需管理员，2通过/3拒绝） |
| GET  | /api/outbound | 出库单列表 |
| POST | /api/outbound | 创建出库单（需登录，校验库存） |
| GET  | /api/outbound/:id | 出库单详情 |
| PUT  | /api/outbound/:id/status | 审批出库单（需管理员） |

### 第四阶段
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/inventory | 库存列表（keyword、category_id、is_warning、分页） |
| GET  | /api/inventory/warning | 预警库存（stock≤min_stock） |
| GET  | /api/inventory/logs | 变动记录（product_id、change_type、日期、分页） |
| GET  | /api/inventory/checks | 盘点单列表 |
| GET  | /api/inventory/checks/:id | 盘点单详情 |
| POST | /api/inventory/check | 创建盘点单（需登录，提交即完成） |

### 第五阶段
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/report/overview | 报表概览（含库存总值、出入库统计） |
| GET  | /api/report/inbound | 入库统计（group_by: product/category/day） |
| GET  | /api/report/outbound | 出库统计 |
| GET  | /api/report/turnover | 库存周转率 |
