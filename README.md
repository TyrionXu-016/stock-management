# 库存管理微信小程序

一个功能完善的库存管理微信小程序，帮助用户高效管理商品库存、入库出库记录等业务。

---

## 一、功能模块

### 1. 用户模块
- **微信登录**: 使用微信授权登录
- **用户信息管理**: 查看和编辑个人资料
- **权限管理**: 普通用户/管理员权限区分

### 2. 商品管理模块
- **商品列表**: 查看所有商品，支持搜索和分类筛选
- **商品详情**: 查看商品的详细信息和库存状态
- **商品新增**: 添加新商品，录入商品信息
- **商品编辑**: 修改商品信息（名称、规格、分类等）
- **商品删除**: 删除失效商品
- **商品分类管理**: 管理商品分类体系

### 3. 入库管理模块
- **入库记录**: 查看所有入库记录
- **入库单录入**: 创建新的入库单，选择商品和数量
- **入库审批**: 管理员审批入库请求（可选）
- **入库统计**: 按时间、商品统计入库情况

### 4. 出库管理模块
- **出库记录**: 查看所有出库记录
- **出库单录入**: 创建新的出库单
- **库存扣减**: 自动扣减对应商品库存
- **出库统计**: 按时间、商品统计出库情况

### 5. 库存监控模块
- **实时库存**: 查看各商品的当前库存量
- **库存预警**: 低库存预警设置和提醒
- **库存盘点**: 定期盘点功能，记录盘盈盘亏
- **库存变动记录**: 查看商品库存的完整变动历史

### 6. 报表统计模块
- **库存总览**: 库存总量、商品种类数等关键指标
- **入库出库报表**: 生成入库出库统计报表
- **库存周转率**: 计算库存周转率
- **数据可视化**: 图表展示统计数据

### 7. 系统设置模块
- **仓库管理**: 多仓库支持（可选）
- **预警设置**: 设置低库存预警阈值
- **数据备份/恢复**: 数据管理功能

---

## 二、数据库表设计

### 2.1 用户表 (t_user)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 用户ID | 主键，自增 |
| openid | VARCHAR(64) | 微信openid | 唯一索引 |
| unionid | VARCHAR(64) | 微信unionid | |
| nickname | VARCHAR(100) | 昵称 | |
| avatar | VARCHAR(500) | 头像URL | |
| phone | VARCHAR(20) | 手机号 | |
| role | TINYINT | 角色 | 1:普通用户 2:管理员 |
| status | TINYINT | 状态 | 1:正常 2:禁用 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 2.2 商品表 (t_product)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 商品ID | 主键，自增 |
| sku_code | VARCHAR(50) | SKU编码 | 唯一索引 |
| name | VARCHAR(200) | 商品名称 | |
| spec | VARCHAR(100) | 规格 | |
| category_id | INT | 分类ID | 外键 |
| brand | VARCHAR(100) | 品牌 | |
| unit | VARCHAR(20) | 单位 | 件、箱、kg等 |
| purchase_price | DECIMAL(10,2) | 进价 | |
| sale_price | DECIMAL(10,2) | 售价 | |
| stock | INT | 当前库存 | |
| min_stock | INT | 最低库存预警值 | |
| max_stock | INT | 最高库存 | |
| status | TINYINT | 状态 | 1:正常 2:下架 |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 2.3 商品分类表 (t_category)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | INT | 分类ID | 主键，自增 |
| name | VARCHAR(50) | 分类名称 | |
| parent_id | INT | 父分类ID | 0为顶级分类 |
| sort | INT | 排序 | |
| create_time | DATETIME | 创建时间 | |

### 2.4 入库单表 (t_inbound_order)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 入库单ID | 主键，自增 |
| order_no | VARCHAR(50) | 入库单号 | 唯一索引 |
| supplier | VARCHAR(100) | 供应商 | |
| operator_id | BIGINT | 操作人ID | 外键 |
| total_quantity | INT | 总数量 | |
| total_amount | DECIMAL(12,2) | 总金额 | |
| status | TINYINT | 状态 | 1:待审批 2:已确认 3:已拒绝 |
| remark | TEXT | 备注 | |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 2.5 入库单明细表 (t_inbound_item)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 明细ID | 主键，自增 |
| inbound_id | BIGINT | 入库单ID | 外键 |
| product_id | BIGINT | 商品ID | 外键 |
| quantity | INT | 数量 | |
| unit_price | DECIMAL(10,2) | 单价 | |
| total_price | DECIMAL(12,2) | 小计 | |
| batch_no | VARCHAR(50) | 批次号 | |
| create_time | DATETIME | 创建时间 | |

### 2.6 出库单表 (t_outbound_order)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 出库单ID | 主键，自增 |
| order_no | VARCHAR(50) | 出库单号 | 唯一索引 |
| receiver | VARCHAR(100) | 收货人/客户 | |
| operator_id | BIGINT | 操作人ID | 外键 |
| total_quantity | INT | 总数量 | |
| total_amount | DECIMAL(12,2) | 总金额 | |
| status | TINYINT | 状态 | 1:待审批 2:已确认 3:已拒绝 |
| remark | TEXT | 备注 | |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 2.7 出库单明细表 (t_outbound_item)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 明细ID | 主键，自增 |
| outbound_id | BIGINT | 出库单ID | 外键 |
| product_id | BIGINT | 商品ID | 外键 |
| quantity | INT | 数量 | |
| unit_price | DECIMAL(10,2) | 单价 | |
| total_price | DECIMAL(12,2) | 小计 | |
| create_time | DATETIME | 创建时间 | |

### 2.8 库存变动记录表 (t_stock_log)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 记录ID | 主键，自增 |
| product_id | BIGINT | 商品ID | 外键 |
| change_type | TINYINT | 变动类型 | 1:入库 2:出库 3:盘点 |
| change_quantity | INT | 变动数量 | 正数为增，负数为减 |
| before_stock | INT | 变动前库存 | |
| after_stock | INT | 变动后库存 | |
| related_id | BIGINT | 关联单据ID | |
| operator_id | BIGINT | 操作人ID | |
| remark | VARCHAR(500) | 备注 | |
| create_time | DATETIME | 创建时间 | |

### 2.9 盘点单表 (t_inventory_check)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 盘点单ID | 主键，自增 |
| check_no | VARCHAR(50) | 盘点单号 | 唯一索引 |
| operator_id | BIGINT | 操作人ID | |
| status | TINYINT | 状态 | 1:进行中 2:已完成 |
| remark | TEXT | 备注 | |
| create_time | DATETIME | 创建时间 | |
| update_time | DATETIME | 更新时间 | |

### 2.10 盘点明细表 (t_inventory_check_item)

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 明细ID | 主键，自增 |
| check_id | BIGINT | 盘点单ID | 外键 |
| product_id | BIGINT | 商品ID | 外键 |
| book_stock | INT | 账面库存 | |
| actual_stock | INT | 实际库存 | |
| diff_quantity | INT | 差异数量 | |
| create_time | DATETIME | 创建时间 | |

---

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     微信小程序前端                        │
├─────────────────────────────────────────────────────────┤
│  页面层          │  组件层           │  工具层           │
│  - 商品列表       │  - 商品卡片       │  - 请求封装       │
│  - 入库出库       │  - 数据表格       │  - 日期处理       │
│  - 库存监控       │  - 统计图表       │  - 数据校验       │
│  - 报表统计       │  - 搜索组件       │  - 存储管理       │
├─────────────────────────────────────────────────────────┤
│                    业务逻辑层                             │
├─────────────────────────────────────────────────────────┤
│                    HTTP API层                            │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│                      后端服务                            │
├─────────────────────────────────────────────────────────┤
│  接口层          │  服务层           │  数据访问层       │
│  - 用户接口       │  - 商品服务       │  - 用户DAO        │
│  - 商品接口       │  - 入库服务       │  - 商品DAO        │
│  - 库存接口       │  - 出库服务       │  - 库存DAO        │
│  - 报表接口       │  - 统计服务       │  - 日志DAO        │
├─────────────────────────────────────────────────────────┤
│                      中间件层                             │
│  - 身份认证  - 权限验证  - 日志记录  - 异常处理          │
├─────────────────────────────────────────────────────────┤
│                      数据持久层                           │
│                    MySQL 数据库                          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 技术栈

#### 前端技术
| 技术 | 版本 | 说明 |
|------|------|------|
| 微信小程序基础库 | 2.45+ | 小程序基础能力 |
| JavaScript | ES6+ | 编程语言 |
| WXML | - | 标记语言 |
| WXSS | - | 样式语言 |
| WeUI | - | 微信官方UI组件库 |

#### 后端技术（推荐）
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Koa / Express | - | Web框架 |
| MySQL | 8.0+ | 关系型数据库 |
| Redis | 7+ | 缓存数据库 |
| Sequelize / TypeORM | - | ORM框架 |
| JWT | - | 身份认证 |

#### 部署技术
| 技术 | 说明 |
|------|------|
| Nginx | 反向代理 |
| PM2 | 进程管理 |
| Docker | 容器化部署 |

### 3.3 目录结构

#### 前端目录结构
```
stockManager/
├── app.js                      # 小程序入口
├── app.json                    # 全局配置
├── app.wxss                    # 全局样式
├── sitemap.json                # 站点地图
├── project.config.json         # 项目配置
│
├── pages/                      # 页面目录
│   ├── index/                  # 首页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── product/                # 商品管理
│   │   ├── list/               # 商品列表
│   │   ├── detail/             # 商品详情
│   │   └── form/               # 商品表单
│   ├── inbound/                # 入库管理
│   │   ├── list/
│   │   └── form/
│   ├── outbound/               # 出库管理
│   │   ├── list/
│   │   └── form/
│   ├── inventory/              # 库存监控
│   │   ├── overview/           # 库存总览
│   │   ├── warning/            # 库存预警
│   │   └── check/              # 库存盘点
│   ├── report/                 # 报表统计
│   │   └── statistics/
│   └── user/                   # 用户中心
│       ├── profile/
│       └── settings/
│
├── components/                 # 自定义组件
│   ├── product-card/
│   ├── data-table/
│   ├── search-bar/
│   └── stat-chart/
│
├── utils/                      # 工具类
│   ├── request.js              # 请求封装
│   ├── auth.js                 # 登录认证
│   ├── date.js                 # 日期处理
│   └── validate.js             # 数据校验
│
├── api/                        # API接口定义
│   ├── product.js
│   ├── inbound.js
│   ├── outbound.js
│   ├── inventory.js
│   └── user.js
│
├── store/                      # 状态管理
│   └── index.js
│
└── assets/                     # 静态资源
    ├── images/
    └── icons/
```

#### 后端目录结构（参考）
```
stock-manager-server/
├── src/
│   ├── app.js                  # 应用入口
│   ├── config/                 # 配置文件
│   │   ├── database.js
│   │   └── constants.js
│   ├── controllers/            # 控制器
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── inbound.controller.js
│   │   ├── outbound.controller.js
│   │   ├── inventory.controller.js
│   │   └── report.controller.js
│   ├── services/               # 业务服务
│   │   ├── user.service.js
│   │   ├── product.service.js
│   │   ├── inbound.service.js
│   │   ├── outbound.service.js
│   │   ├── inventory.service.js
│   │   └── report.service.js
│   ├── models/                 # 数据模型
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── inbound.model.js
│   │   ├── outbound.model.js
│   │   └── inventory.model.js
│   ├── middlewares/            # 中间件
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── log.middleware.js
│   ├── routes/                 # 路由
│   │   ├── index.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── inbound.routes.js
│   │   ├── outbound.routes.js
│   │   └── report.routes.js
│   └── utils/                  # 工具类
│       ├── response.js
│       └── validator.js
├── database/                   # 数据库脚本
│   ├── schema.sql
│   └── data.sql
└── package.json
```

### 3.4 核心API设计

- 接口文档：[docs/API.md](./docs/API.md)
- 前端页面设计（按开发顺序）：[docs/FRONTEND_PAGES.md](./docs/FRONTEND_PAGES.md)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 微信登录 |
| GET | /api/user/profile | 获取用户信息 |
| GET | /api/products | 获取商品列表 |
| POST | /api/products | 创建商品 |
| PUT | /api/products/:id | 更新商品 |
| DELETE | /api/products/:id | 删除商品 |
| GET | /api/inbound | 获取入库单列表 |
| POST | /api/inbound | 创建入库单 |
| PUT | /api/inbound/:id/status | 更新入库单状态 |
| GET | /api/outbound | 获取出库单列表 |
| POST | /api/outbound | 创建出库单 |
| PUT | /api/outbound/:id/status | 更新出库单状态 |
| GET | /api/inventory | 获取库存列表 |
| GET | /api/inventory/warning | 获取预警库存 |
| POST | /api/inventory/check | 创建盘点单 |
| GET | /api/report/overview | 获取报表概览 |

---

## 四、核心业务流程

### 4.1 入库流程
```
1. 用户创建入库单 → 录入商品和数量
2. 提交入库单 → 生成待审批状态
3. 管理员审批 → 审核入库信息
4. 确认入库 →
   - 更新商品库存
   - 记录库存变动
   - 更新入库单状态
```

### 4.2 出库流程
```
1. 用户创建出库单 → 录入商品和数量
2. 系统校验库存 → 检查是否有足够库存
3. 提交出库单 → 生成待审批状态
4. 管理员审批 → 审核出库信息
5. 确认出库 →
   - 扣减商品库存
   - 记录库存变动
   - 更新出库单状态
   - 检查库存预警
```

### 4.3 库存预警流程
```
1. 出库时检查 → 库存是否低于预警值
2. 触发预警 → 生成预警记录
3. 消息通知 → 通知相关用户
4. 预警处理 → 用户进行补货处理
```

---

## 五、开发计划

### 第一阶段：基础框架
- [ ] 搭建后端服务框架
- [ ] 设计并创建数据库表
- [ ] 完成用户登录认证
- [ ] 封装API请求工具

### 第二阶段：商品管理
- [ ] 商品列表页面
- [ ] 商品详情页面
- [ ] 商品新增/编辑/删除
- [ ] 商品分类管理

### 第三阶段：出入库管理
- [ ] 入库单列表和创建
- [ ] 出库单列表和创建
- [ ] 出入库审批流程
- [ ] 库存自动更新

### 第四阶段：库存监控
- [ ] 库存总览页面
- [ ] 库存预警功能
- [ ] 库存盘点功能
- [ ] 库存变动记录

### 第五阶段：报表统计
- [ ] 报表概览页面
- [ ] 入库出库统计
- [ ] 数据可视化图表

---

## 六、快速开始

### 项目状态说明
- **前端**：微信小程序框架已搭建，当前为初始模板（index、logs 页面），需按开发计划逐步完善
- **后端**：待开发，按「3.3 目录结构」中的 backend 结构搭建
- **数据库**：远程 MySQL 已就绪，详见 [server_info.md](./server_info.md)

### 环境要求
- 微信开发者工具
- Node.js 18+
- MySQL 8.0+（本地需安装 mysql 客户端，用于执行建表脚本；数据库运行在远程服务器）

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd stockManager
```

#### 2. 初始化数据库
数据库连接信息见 [server_info.md](./server_info.md)。本地安装 mysql 客户端后执行：

```bash
mysql -h 114.55.139.240 -P 3306 -u stock_user -pStock@2024 < database/schema.sql
```

脚本会自动创建 `stock_manager` 库及所有表结构。

#### 3. 运行小程序前端
使用微信开发者工具打开项目根目录 `stockManager`，选择或输入 AppID 即可预览。

#### 4. 启动后端服务（后端开发完成后）
```bash
cd stock-manager-server   # 后端项目目录，按 3.3 节创建
npm install
cp .env.example .env      # 配置数据库连接等，参考 server_info.md
npm run dev
```

---

## 七、项目特色

- **简洁高效**: 界面简洁，操作便捷，提升库存管理效率
- **实时监控**: 库存实时更新，低库存智能预警
- **数据完整**: 完整的出入库记录，库存变动可追溯
- **权限管理**: 支持多角色权限控制，保证数据安全
- **报表统计**: 丰富的报表功能，帮助决策分析

---

## License

MIT
