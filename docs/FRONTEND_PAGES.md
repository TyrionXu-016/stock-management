# 库存管理小程序 - 前端页面设计

> 按开发顺序划分，每个阶段包含页面路径、功能说明、依赖接口及开发要点。

---

## 开发顺序总览

| 阶段 | 页面数 | 依赖 |
|------|--------|------|
| 第一阶段：基础框架 | 3 | 无 |
| 第二阶段：商品管理 | 5 | 认证、分类接口 |
| 第三阶段：出入库管理 | 6 | 商品接口 |
| 第四阶段：库存监控 | 5 | 出入库接口 |
| 第五阶段：报表统计 | 2 | 全部接口 |
| 第六阶段：系统设置 | 2 | 用户接口 |

---

## 第一阶段：基础框架

> 搭建登录流程、请求封装、全局状态，为后续页面提供基础能力。

### 1.1 登录页 `pages/login/login`

**路径**：`/pages/login/login`

**功能**：微信授权登录入口，未登录用户进入小程序时展示。

**页面元素**：
- 小程序 Logo / 品牌名
- 「微信一键登录」按钮 → 调用 wx.login + 后端 `/api/auth/login`
- 用户协议勾选（可选）
- 登录说明文案

**依赖接口**：`POST /api/auth/login`

**跳转**：登录成功 → 跳转首页或来源页

**开发要点**：检查本地 token，有则直接进首页；登录后存储 token 和用户信息到本地。

---

### 1.2 首页 `pages/index/index`

**路径**：`/pages/index/index`

**功能**：工作台入口，展示关键指标和快捷入口。

**页面元素**：
- 顶部欢迎区（含用户昵称）
- 快捷数据卡片：商品数、预警数、待审批入库/出库数
- 功能入口网格：
  - 商品管理 → `pages/product/list/list`
  - 入库管理 → `pages/inbound/list/list`
  - 出库管理 → `pages/outbound/list/list`
  - 库存监控 → `pages/inventory/overview/overview`
  - 报表统计 → `pages/report/overview/overview`
- 底部 TabBar：首页、商品、出入库、我的

**依赖接口**：`GET /api/report/overview`（可简化，仅取商品数、预警数等）

**开发要点**：首页可先写死或请求简化接口，后续再接入完整报表。

---

### 1.3 个人中心 `pages/user/profile/profile`

**路径**：`/pages/user/profile/profile`

**功能**：展示和编辑个人资料。

**页面元素**：
- 头像、昵称、手机号展示
- 编辑入口 → `pages/user/edit/edit`
- 设置入口 → `pages/user/settings/settings`
- 退出登录

**依赖接口**：`GET /api/user/profile`

**开发要点**：首次进入可静默拉取并缓存用户信息。

---

## 第二阶段：商品管理

> 商品与分类的增删改查，支撑后续出入库选品。

### 2.1 商品列表 `pages/product/list/list`

**路径**：`/pages/product/list/list`

**功能**：商品列表，支持搜索、分类筛选、分页。

**页面元素**：
- 搜索框（按名称/SKU）
- 分类筛选（下拉或 tabs）
- 商品卡片列表：名称、SKU、库存、状态
- 右上角「添加」→ `pages/product/form/form`
- 点击卡片 → `pages/product/detail/detail`
- 下拉刷新、上拉加载

**依赖接口**：`GET /api/products`、`GET /api/categories`

**开发要点**：需封装 `product-card` 组件；库存低于 min_stock 时显示预警样式。

---

### 2.2 商品详情 `pages/product/detail/detail`

**路径**：`/pages/product/detail/detail?id=1`

**功能**：展示单个商品完整信息。

**页面元素**：
- 基础信息：名称、SKU、规格、分类、品牌、单位
- 价格：进价、售价
- 库存：当前库存、最低/最高库存，预警提示
- 状态：正常/下架
- 操作按钮：编辑、删除（管理员）
- 底部「库存变动记录」入口 → `pages/inventory/logs/logs?product_id=1`

**依赖接口**：`GET /api/products/:id`

**开发要点**：删除前需二次确认；下架商品在出库选品时过滤。

---

### 2.3 商品表单 `pages/product/form/form`

**路径**：`/pages/product/form/form`（新增）  
**路径**：`/pages/product/form/form?id=1`（编辑）

**功能**：新增或编辑商品。

**页面元素**：
- 表单字段：名称、SKU、规格、分类、品牌、单位、进价、售价、最低库存、最高库存
- 分类选择器（调用分类接口）
- 提交、取消按钮
- 编辑时预填数据

**依赖接口**：`POST /api/products`、`PUT /api/products/:id`、`GET /api/products/:id`、`GET /api/categories`

**开发要点**：SKU 新增时必填，编辑时可只读；数字字段校验。

---

### 2.4 商品分类列表 `pages/category/list/list`

**路径**：`/pages/category/list/list`

**功能**：管理商品分类（一级/二级）。

**页面元素**：
- 分类列表（可树形或平铺）
- 添加分类按钮
- 每项：名称、排序、编辑/删除（管理员）
- 点击编辑 → 弹窗或 `pages/category/form/form`

**依赖接口**：`GET /api/categories`、`POST /api/categories`、`PUT /api/categories/:id`、`DELETE /api/categories/:id`

**开发要点**：删除前检查是否有关联商品；可拖拽排序（可选）。

---

### 2.5 商品分类表单 `pages/category/form/form`

**路径**：`/pages/category/form/form`、`/pages/category/form/form?id=1`

**功能**：新增/编辑分类。

**页面元素**：
- 分类名称、父分类选择、排序
- 提交、取消

**依赖接口**：同 2.4

---

## 第三阶段：出入库管理

> 入库单、出库单的创建、列表、详情及审批。

### 3.1 入库单列表 `pages/inbound/list/list`

**路径**：`/pages/inbound/list/list`

**功能**：查看入库单，支持状态筛选、日期筛选。

**页面元素**：
- 筛选：状态（待审批/已确认/已拒绝）、日期范围
- 列表：单号、供应商、总数量、状态、时间
- 右上角「新建入库」→ `pages/inbound/form/form`
- 点击行 → `pages/inbound/detail/detail`
- 待审批项显示审批按钮（管理员）

**依赖接口**：`GET /api/inbound`

---

### 3.2 入库单详情 `pages/inbound/detail/detail`

**路径**：`/pages/inbound/detail/detail?id=1`

**功能**：查看入库单详情及明细。

**页面元素**：
- 单号、供应商、操作人、创建时间
- 状态标签：待审批/已确认/已拒绝
- 商品明细：名称、数量、单价、小计、批次号
- 总数量、总金额
- 备注
- 审批操作（管理员，仅待审批）：通过、拒绝

**依赖接口**：`GET /api/inbound/:id`、`PUT /api/inbound/:id/status`

---

### 3.3 入库单表单 `pages/inbound/form/form`

**路径**：`/pages/inbound/form/form`

**功能**：新建入库单，选择商品并填写数量、单价等。

**页面元素**：
- 供应商、备注
- 商品选择区：搜索/选择商品 → 填写数量、单价、批次号
- 支持多商品、动态增删
- 底部汇总：总数量、总金额
- 提交、取消

**依赖接口**：`POST /api/inbound`、`GET /api/products`

**开发要点**：选品可复用商品选择器组件；小计、总计前端计算并随提交。

---

### 3.4 出库单列表 `pages/outbound/list/list`

**路径**：`/pages/outbound/list/list`

**功能**：与入库单列表类似。

**页面元素**：同 3.1，将「供应商」改为「收货人/客户」，「新建入库」改为「新建出库」。

**依赖接口**：`GET /api/outbound`

---

### 3.5 出库单详情 `pages/outbound/detail/detail`

**路径**：`/pages/outbound/detail/detail?id=1`

**功能**：与入库单详情类似，含审批操作。

**依赖接口**：`GET /api/outbound/:id`、`PUT /api/outbound/:id/status`

---

### 3.6 出库单表单 `pages/outbound/form/form`

**路径**：`/pages/outbound/form/form`

**功能**：新建出库单。

**页面元素**：
- 收货人/客户、备注
- 商品选择：选择商品、数量、单价
- 需实时校验库存，不足时提示
- 提交、取消

**依赖接口**：`POST /api/outbound`、`GET /api/products`（列表含 stock 字段，用于选品及库存校验）

**开发要点**：选品时展示当前库存（来自 products 接口）；提交前再次校验。

---

## 第四阶段：库存监控

> 库存总览、预警、盘点、变动记录。

### 4.1 库存总览 `pages/inventory/overview/overview`

**路径**：`/pages/inventory/overview/overview`

**功能**：查看各商品当前库存。

**页面元素**：
- 汇总：商品种类数、库存总量（可选：库存金额）
- 筛选：分类、是否仅预警
- 列表：商品名称、SKU、当前库存、预警值、单位、是否预警
- 点击行 → `pages/product/detail/detail`
- 入口：库存预警、盘点、变动记录

**依赖接口**：`GET /api/inventory`

---

### 4.2 库存预警 `pages/inventory/warning/warning`

**路径**：`/pages/inventory/warning/warning`

**功能**：展示库存低于预警值的商品。

**页面元素**：
- 预警数量统计
- 列表：商品、当前库存、预警值、缺口
- 快捷操作：补货（跳转入库单表单，预填该商品）

**依赖接口**：`GET /api/inventory/warning`

---

### 4.3 库存盘点 `pages/inventory/check/check`

**路径**：`/pages/inventory/check/check`

**功能**：创建盘点单，录入实际库存。

**页面元素**：
- 新建盘点入口
- 盘点单列表：单号、状态、创建时间
- 点击 → `pages/inventory/check-detail/check-detail`

**依赖接口**：`GET /api/inventory/checks`、`POST /api/inventory/check`

---

### 4.4 盘点单详情/录入 `pages/inventory/check-detail/check-detail`

**路径**：`/pages/inventory/check-detail/check-detail?id=1`（查看）  
**路径**：`/pages/inventory/check-form/check-form`（新建）

**说明**：盘点采用「一次性提交即完成」流程，创建后状态为已完成。

**新建盘点页面元素**：
- 选择要盘点的商品（可多选或全选）
- 每行：商品名、账面库存（只读）、实际库存（输入）
- 自动算差异
- 备注、提交

**详情页面元素**：
- 单号、状态、操作人、时间
- 明细：商品、账面、实际、差异（盘盈/盘亏）

**依赖接口**：`GET /api/inventory/checks/:id`、`POST /api/inventory/check`

---

### 4.5 库存变动记录 `pages/inventory/logs/logs`

**路径**：`/pages/inventory/logs/logs`  
**路径**：`/pages/inventory/logs/logs?product_id=1`（按商品筛选）

**功能**：查看库存变动流水。

**页面元素**：
- 筛选：商品、变动类型（入库/出库/盘点）、日期
- 列表：时间、商品、类型、变动数量、变动前/后库存、操作人、关联单号
- 分页加载

**依赖接口**：`GET /api/inventory/logs`

---

## 第五阶段：报表统计

### 5.1 报表概览 `pages/report/overview/overview`

**路径**：`/pages/report/overview/overview`

**功能**：核心指标与图表。

**页面元素**：
- 日期选择（可选）
- 指标卡片：商品数、库存总值、入库单数/数量、出库单数/数量、待审批入库/出库数、预警数
- 简单图表：入库/出库趋势（可选 echarts 或小程序图表组件）
- 入口：入库统计、出库统计、周转率

**依赖接口**：`GET /api/report/overview`

---

### 5.2 报表统计详情 `pages/report/statistics/statistics`

**路径**：`/pages/report/statistics/statistics?type=inbound`  
**路径**：`/pages/report/statistics/statistics?type=outbound`  
**路径**：`/pages/report/statistics/statistics?type=turnover`

**功能**：按类型展示入库、出库或周转率详情。

**页面元素**：
- 日期范围（start_date、end_date，不传时默认当月）
- 分组维度（入库/出库支持：按商品/分类/日期）
- 列表/图表展示
- type=inbound/outbound：数量、金额
- type=turnover：周转率

**依赖接口**：`GET /api/report/inbound`、`GET /api/report/outbound`、`GET /api/report/turnover`

**开发要点**：日期不传时接口默认统计当月数据。

---

## 第六阶段：系统设置

### 6.1 个人资料编辑 `pages/user/edit/edit`

**路径**：`/pages/user/edit/edit`

**功能**：修改昵称、头像、手机号。

**页面元素**：表单字段 + 提交

**依赖接口**：`PUT /api/user/profile`

---

### 6.2 设置页 `pages/user/settings/settings`

**路径**：`/pages/user/settings/settings`

**功能**：系统设置入口（可选扩展）。

**页面元素**：
- 分类管理入口 → `pages/category/list/list`
- 关于、版本号
- 清除缓存
- 退出登录

---

## 页面与路由汇总

```
pages/
├── index/index                 # 首页
├── login/login                 # 登录
├── user/
│   ├── profile/profile         # 个人中心
│   ├── edit/edit               # 编辑资料
│   └── settings/settings       # 设置
├── product/
│   ├── list/list               # 商品列表
│   ├── detail/detail           # 商品详情
│   └── form/form               # 商品表单
├── category/
│   ├── list/list               # 分类列表
│   └── form/form               # 分类表单
├── inbound/
│   ├── list/list               # 入库单列表
│   ├── detail/detail           # 入库单详情
│   └── form/form               # 入库单表单
├── outbound/
│   ├── list/list               # 出库单列表
│   ├── detail/detail           # 出库单详情
│   └── form/form               # 出库单表单
├── inventory/
│   ├── overview/overview       # 库存总览
│   ├── warning/warning         # 库存预警
│   ├── check/check             # 盘点列表
│   ├── check-detail/check-detail   # 盘点详情
│   ├── check-form/check-form   # 新建盘点（可与 check-detail 合并）
│   └── logs/logs               # 变动记录
└── report/
    ├── overview/overview       # 报表概览
    └── statistics/statistics   # 统计详情
```

---

## TabBar 建议配置

| 文本 | 页面 | 图标 |
|------|------|------|
| 首页 | pages/index/index | home |
| 商品 | pages/product/list/list | apps |
| 出入库 | pages/inbound/list/list 或单独出入库入口页 | list |
| 我的 | pages/user/profile/profile | user |

---

## 可复用组件建议

| 组件 | 用途 |
|------|------|
| product-card | 商品卡片，列表展示 |
| product-picker | 商品选择器，出入库、盘点选品 |
| category-picker | 分类选择器 |
| order-card | 出入库单卡片 |
| stat-card | 统计数字卡片 |
| search-bar | 搜索框 |
| empty-state | 空状态占位 |
