# 库存管理小程序 - 后端接口编码阶段

> 参考前端页面开发顺序，按阶段组织后端 API 实现。每个阶段包含接口列表、依赖说明及开发要点。

---

## 开发顺序总览

| 阶段 | 接口数 | 依赖说明 |
|------|--------|----------|
| 第一阶段：认证与用户 | 3 | 数据库、微信小程序配置 |
| 第二阶段：商品与分类 | 9 | 认证中间件 |
| 第三阶段：出入库管理 | 9 | 商品表、库存逻辑 |
| 第四阶段：库存监控 | 6 | 出入库、库存变动记录 |
| 第五阶段：报表统计 | 4 | 全部业务表 |
| 第六阶段：系统设置 | 0 | 复用用户接口 |

---

## 第一阶段：认证与用户

> 为前端基础框架（登录、首页、个人中心）提供接口支撑。

### 1.1 认证接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 微信登录 | POST | `/api/auth/login` | 接收 code 换取 token 和用户信息 |

**请求体**：`{ "code": "微信登录返回的 code" }`

**响应**：`{ token, user: { id, nickname, avatar, role } }`

**开发要点**：
- 调用微信 `code2session` 获取 openid/session_key
- 首次登录创建用户，已存在则更新
- 生成 JWT token 返回

---

### 1.2 用户接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取用户信息 | GET | `/api/user/profile` | 需登录 |
| 更新用户信息 | PUT | `/api/user/profile` | 需登录 |

**开发要点**：
- 实现认证中间件（JWT 校验）
- 支持昵称、头像、手机号更新

---

### 1.3 报表概览（简化版）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 报表概览 | GET | `/api/report/overview` | 首页指标卡片用 |

**Query**：`start_date`, `end_date`（可选）

**响应字段**：`product_count`、`warning_count`、`pending_inbound_count`、`pending_outbound_count` 等

**开发要点**：本阶段可先实现简化版，仅返回商品数、预警数、待审批数量；完整统计可后续补充。

---

## 第二阶段：商品与分类

> 支撑商品管理、分类管理页面。

### 2.1 分类接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取分类列表 | GET | `/api/categories` | 支持 parent_id 筛选、树形结构 |
| 创建分类 | POST | `/api/categories` | 需登录，建议管理员 |
| 更新分类 | PUT | `/api/categories/:id` | 需登录 |
| 删除分类 | DELETE | `/api/categories/:id` | 需登录，管理员 |

**开发要点**：
- 删除前校验是否有关联商品
- 分类支持 parent_id 实现一级/二级分类

---

### 2.2 商品接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取商品列表 | GET | `/api/products` | keyword、category_id、status、分页 |
| 获取商品详情 | GET | `/api/products/:id` | 单条详情 |
| 创建商品 | POST | `/api/products` | 需登录 |
| 更新商品 | PUT | `/api/products/:id` | 需登录 |
| 删除商品 | DELETE | `/api/products/:id` | 需登录，管理员 |

**开发要点**：
- SKU 唯一性校验
- 列表返回 stock、min_stock，便于预警展示
- 下架商品 status=2，出库选品时过滤

---

## 第三阶段：出入库管理

> 支撑入库单、出库单的列表、详情、表单及审批。

### 3.1 入库接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取入库单列表 | GET | `/api/inbound` | status、start_date、end_date、分页 |
| 获取入库单详情 | GET | `/api/inbound/:id` | 含明细 items |
| 创建入库单 | POST | `/api/inbound` | 需登录 |
| 更新入库单状态 | PUT | `/api/inbound/:id/status` | 需登录，管理员（审批） |

**请求体（创建）**：`{ supplier, remark, items: [{ product_id, quantity, unit_price, batch_no }] }`

**开发要点**：
- 创建时生成 order_no（如 IN202401010001）
- 状态 1:待审批 2:已确认 3:已拒绝
- 审批通过后：更新库存、写入库存变动记录

---

### 3.2 出库接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取出库单列表 | GET | `/api/outbound` | 同入库 |
| 获取出库单详情 | GET | `/api/outbound/:id` | 含明细 |
| 创建出库单 | POST | `/api/outbound` | 需登录 |
| 更新出库单状态 | PUT | `/api/outbound/:id/status` | 需登录，管理员 |

**请求体（创建）**：`{ receiver, remark, items: [{ product_id, quantity, unit_price }] }`

**开发要点**：
- 创建时校验库存是否充足，不足返回 422 及明确提示
- 审批通过后扣减库存、写入变动记录

---

## 第四阶段：库存监控

> 支撑库存总览、预警、盘点、变动记录页面。

### 4.1 库存接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取库存列表 | GET | `/api/inventory` | keyword、category_id、is_warning、分页 |
| 获取预警库存 | GET | `/api/inventory/warning` | 库存 ≤ min_stock 的商品，不分页 |
| 获取变动记录 | GET | `/api/inventory/logs` | product_id、change_type、日期、分页 |

**开发要点**：
- inventory 列表可基于 products 表 + stock 计算
- change_type：1 入库 2 出库 3 盘点

---

### 4.2 盘点接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取盘点单列表 | GET | `/api/inventory/checks` | status、分页 |
| 获取盘点单详情 | GET | `/api/inventory/checks/:id` | 含明细 |
| 创建盘点单 | POST | `/api/inventory/check` | 需登录 |

**请求体（创建）**：`{ remark, items: [{ product_id, book_stock, actual_stock }] }`

**开发要点**：
- 自动计算 diff_quantity = actual_stock - book_stock
- 提交即完成，更新库存并写入变动记录

---

## 第五阶段：报表统计

> 支撑报表概览及统计详情页。

### 5.1 报表接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 报表概览（完整） | GET | `/api/report/overview` | 第一阶段已做简化，本阶段补全 |
| 入库统计 | GET | `/api/report/inbound` | group_by: product/category/day |
| 出库统计 | GET | `/api/report/outbound` | 同入库 |
| 周转率 | GET | `/api/report/turnover` | 周转率 = 出库量/平均库存 |

**Query 通用**：`start_date`、`end_date`（不传时默认当月）

**开发要点**：
- 日期不传时默认 start_date=当月1日，end_date=当天
- turnover 需按商品计算平均库存与出库量

---

## 第六阶段：系统设置

> 个人资料编辑、设置页均复用已有接口，无需新增。

| 功能 | 复用接口 |
|------|----------|
| 编辑资料 | PUT `/api/user/profile` |
| 分类管理入口 | GET `/api/categories`、CRUD 已实现 |

---

## 接口与阶段对照表

| 模块 | 接口路径 | 所属阶段 |
|------|----------|----------|
| 认证 | POST /api/auth/login | 一 |
| 用户 | GET/PUT /api/user/profile | 一 |
| 报表 | GET /api/report/overview | 一（简化）、五（完整） |
| 分类 | GET/POST/PUT/DELETE /api/categories | 二 |
| 商品 | GET/POST/PUT/DELETE /api/products, /api/products/:id | 二 |
| 入库 | GET/POST /api/inbound, /api/inbound/:id, PUT /api/inbound/:id/status | 三 |
| 出库 | GET/POST /api/outbound, /api/outbound/:id, PUT /api/outbound/:id/status | 三 |
| 库存 | GET /api/inventory, GET /api/inventory/warning, GET /api/inventory/logs | 四 |
| 盘点 | GET/POST /api/inventory/checks, /api/inventory/checks/:id, POST /api/inventory/check | 四 |
| 报表 | GET /api/report/inbound, /api/report/outbound, /api/report/turnover | 五 |

---

## 实施建议

1. **先做第一阶段**：认证、用户、报表概览（简化），保证前端能完成登录和首页。
2. **按依赖顺序开发**：商品/分类 → 出入库 → 库存/盘点 → 报表完整版。
3. **统一响应格式**：`{ code, message, data }`，分页统一 `{ list, total, page, page_size }`。
4. **事务与库存**：出入库审批、盘点提交需在事务中完成，确保库存与变动记录一致。
