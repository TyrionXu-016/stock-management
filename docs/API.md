# 库存管理 API 接口文档

> 按功能模块划分，供微信小程序前端调用。基础路径：`/api`

## 通用说明

### 请求格式
- Content-Type: `application/json`
- 需登录接口在 Header 中携带：`Authorization: Bearer <token>`

### 统一响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 0 成功，非 0 失败 |
| message | string | 提示信息 |
| data | object/array | 业务数据 |

### 分页参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页条数 |

### 分页响应格式
```json
{
  "code": 0,
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

---

## 一、认证模块 `/api/auth`

### 1.1 微信登录

**POST** `/api/auth/login`

小程序通过 wx.login 获取 code 后，调用此接口换取 token。

**请求体**
```json
{
  "code": "微信登录返回的 code"
}
```

**响应**
```json
{
  "code": 0,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "nickname": "用户昵称",
      "avatar": "头像URL",
      "role": 1
    }
  }
}
```

| 角色 | role | 说明 |
|------|------|------|
| 普通用户 | 1 | 可查看、创建出入库单 |
| 管理员 | 2 | 可审批、删除、管理所有数据 |

---

## 二、用户模块 `/api/user`

### 2.1 获取当前用户信息

**GET** `/api/user/profile`  
需要登录

**响应**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "openid": "xxx",
    "nickname": "昵称",
    "avatar": "https://xxx",
    "phone": "13800138000",
    "role": 1,
    "status": 1,
    "create_time": "2024-01-01 12:00:00"
  }
}
```

### 2.2 更新用户信息

**PUT** `/api/user/profile`  
需要登录

**请求体**
```json
{
  "nickname": "新昵称",
  "avatar": "https://xxx",
  "phone": "13800138000"
}
```

---

## 三、商品分类模块 `/api/categories`

### 3.1 获取分类列表

**GET** `/api/categories`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parent_id | int | 否 | 父分类ID，0 或不传为顶级分类 |

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "食品",
      "parent_id": 0,
      "sort": 1,
      "children": []
    }
  ]
}
```

### 3.2 创建分类

**POST** `/api/categories`  
需要登录，建议管理员

**请求体**
```json
{
  "name": "分类名称",
  "parent_id": 0,
  "sort": 1
}
```

### 3.3 更新分类

**PUT** `/api/categories/:id`  
需要登录

**请求体**
```json
{
  "name": "新名称",
  "sort": 2
}
```

### 3.4 删除分类

**DELETE** `/api/categories/:id`  
需要登录，管理员

---

## 四、商品模块 `/api/products`

### 4.1 获取商品列表

**GET** `/api/products`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 商品名称/SKU 搜索 |
| category_id | int | 否 | 分类ID筛选 |
| status | int | 否 | 1:正常 2:下架 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "sku_code": "SKU001",
        "name": "商品A",
        "spec": "500g/袋",
        "category_id": 1,
        "category_name": "食品",
        "brand": "品牌名",
        "unit": "件",
        "purchase_price": "10.00",
        "sale_price": "15.00",
        "stock": 100,
        "min_stock": 10,
        "max_stock": 500,
        "status": 1,
        "create_time": "2024-01-01 12:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 20
  }
}
```

### 4.2 获取商品详情

**GET** `/api/products/:id`

**响应**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "sku_code": "SKU001",
    "name": "商品A",
    "spec": "500g/袋",
    "category_id": 1,
    "category_name": "食品",
    "brand": "品牌名",
    "unit": "件",
    "purchase_price": "10.00",
    "sale_price": "15.00",
    "stock": 100,
    "min_stock": 10,
    "max_stock": 500,
    "status": 1,
    "create_time": "2024-01-01 12:00:00",
    "update_time": "2024-01-02 12:00:00"
  }
}
```

### 4.3 创建商品

**POST** `/api/products`  
需要登录

**请求体**
```json
{
  "sku_code": "SKU001",
  "name": "商品名称",
  "spec": "规格",
  "category_id": 1,
  "brand": "品牌",
  "unit": "件",
  "purchase_price": 10.00,
  "sale_price": 15.00,
  "min_stock": 10,
  "max_stock": 500
}
```

### 4.4 更新商品

**PUT** `/api/products/:id`  
需要登录

**请求体**（字段均可选，只传需修改的）
```json
{
  "name": "新名称",
  "spec": "新规格",
  "category_id": 1,
  "brand": "品牌",
  "unit": "件",
  "purchase_price": 10.00,
  "sale_price": 15.00,
  "min_stock": 10,
  "max_stock": 500,
  "status": 1
}
```

### 4.5 删除商品

**DELETE** `/api/products/:id`  
需要登录，管理员

---

## 五、入库模块 `/api/inbound`

### 5.1 获取入库单列表

**GET** `/api/inbound`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 否 | 1:待审批 2:已确认 3:已拒绝 |
| start_date | string | 否 | 开始日期 YYYY-MM-DD |
| end_date | string | 否 | 结束日期 YYYY-MM-DD |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "IN202401010001",
        "supplier": "供应商A",
        "operator_id": 1,
        "operator_name": "张三",
        "total_quantity": 100,
        "total_amount": "1500.00",
        "status": 1,
        "remark": "备注",
        "create_time": "2024-01-01 12:00:00",
        "items": [
          {
            "product_id": 1,
            "product_name": "商品A",
            "sku_code": "SKU001",
            "quantity": 50,
            "unit_price": "10.00",
            "total_price": "500.00"
          }
        ]
      }
    ],
    "total": 20,
    "page": 1,
    "page_size": 20
  }
}
```

### 5.2 获取入库单详情

**GET** `/api/inbound/:id`

**响应**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "order_no": "IN202401010001",
    "supplier": "供应商A",
    "operator_id": 1,
    "operator_name": "张三",
    "total_quantity": 100,
    "total_amount": "1500.00",
    "status": 1,
    "remark": "备注",
    "create_time": "2024-01-01 12:00:00",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "商品A",
        "sku_code": "SKU001",
        "quantity": 50,
        "unit_price": "10.00",
        "total_price": "500.00",
        "batch_no": "B20240101"
      }
    ]
  }
}
```

### 5.3 创建入库单

**POST** `/api/inbound`  
需要登录

**请求体**
```json
{
  "supplier": "供应商A",
  "remark": "备注",
  "items": [
    {
      "product_id": 1,
      "quantity": 50,
      "unit_price": "10.00",
      "batch_no": "B20240101"
    }
  ]
}
```

### 5.4 更新入库单状态（审批）

**PUT** `/api/inbound/:id/status`  
需要登录，管理员

**请求体**
```json
{
  "status": 2
}
```
| status | 说明 |
|--------|------|
| 2 | 已确认（通过） |
| 3 | 已拒绝 |

---

## 六、出库模块 `/api/outbound`

### 6.1 获取出库单列表

**GET** `/api/outbound`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 否 | 1:待审批 2:已确认 3:已拒绝 |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应** 格式同入库单列表

### 6.2 获取出库单详情

**GET** `/api/outbound/:id`

### 6.3 创建出库单

**POST** `/api/outbound`  
需要登录

**请求体**
```json
{
  "receiver": "客户/收货人",
  "remark": "备注",
  "items": [
    {
      "product_id": 1,
      "quantity": 20,
      "unit_price": "15.00"
    }
  ]
}
```
> 创建时会校验库存是否充足，不足则返回错误

### 6.4 更新出库单状态（审批）

**PUT** `/api/outbound/:id/status`  
需要登录，管理员

**请求体**
```json
{
  "status": 2
}
```

---

## 七、库存模块 `/api/inventory`

### 7.1 获取库存列表

**GET** `/api/inventory`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 商品名称/SKU |
| category_id | int | 否 | 分类筛选 |
| is_warning | int | 否 | 1:仅预警商品（库存 ≤ min_stock） |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "product_id": 1,
        "sku_code": "SKU001",
        "product_name": "商品A",
        "stock": 5,
        "min_stock": 10,
        "is_warning": true,
        "unit": "件"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 20
  }
}
```

### 7.2 获取预警库存

**GET** `/api/inventory/warning`

返回 `stock <= min_stock` 的商品列表，不分页。

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "product_id": 1,
      "product_name": "商品A",
      "sku_code": "SKU001",
      "stock": 5,
      "min_stock": 10,
      "unit": "件"
    }
  ]
}
```

### 7.3 获取库存变动记录

**GET** `/api/inventory/logs`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| product_id | int | 否 | 商品ID |
| change_type | int | 否 | 1:入库 2:出库 3:盘点 |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

**响应**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "商品A",
        "change_type": 1,
        "change_quantity": 50,
        "before_stock": 50,
        "after_stock": 100,
        "related_id": 1,
        "operator_name": "张三",
        "remark": "入库",
        "create_time": "2024-01-01 12:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 7.4 创建盘点单

**POST** `/api/inventory/check`  
需要登录

**请求体**
```json
{
  "remark": "月末盘点",
  "items": [
    {
      "product_id": 1,
      "book_stock": 100,
      "actual_stock": 98
    }
  ]
}
```
> 系统自动计算 diff_quantity = actual_stock - book_stock，并更新库存、记录变动

### 7.5 获取盘点单列表

**GET** `/api/inventory/checks`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 否 | 1:进行中 2:已完成 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页条数 |

### 7.6 获取盘点单详情

**GET** `/api/inventory/checks/:id`

---

## 八、报表统计模块 `/api/report`

### 8.1 获取报表概览

**GET** `/api/report/overview`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 统计开始日期 |
| end_date | string | 否 | 统计结束日期 |

**响应**
```json
{
  "code": 0,
  "data": {
    "product_count": 50,
    "total_stock_value": "150000.00",
    "inbound_count": 20,
    "inbound_quantity": 500,
    "outbound_count": 15,
    "outbound_quantity": 300,
    "warning_count": 5,
    "pending_inbound_count": 3,
    "pending_outbound_count": 2
  }
}
```

| 字段 | 说明 |
|------|------|
| pending_inbound_count | 待审批入库单数 |
| pending_outbound_count | 待审批出库单数 |

### 8.2 入库统计

**GET** `/api/report/inbound`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 YYYY-MM-DD，不传默认当月 1 日 |
| end_date | string | 否 | 结束日期 YYYY-MM-DD，不传默认当天 |
| group_by | string | 否 | 按 product/category/day 分组，不传默认 product |

**响应示例（按商品分组）**
```json
{
  "code": 0,
  "data": [
    {
      "product_id": 1,
      "product_name": "商品A",
      "total_quantity": 200,
      "total_amount": "2000.00"
    }
  ]
}
```

### 8.3 出库统计

**GET** `/api/report/outbound`

Query 参数同入库统计（start_date、end_date 不传时默认当月）；响应格式同入库统计

### 8.4 库存周转率

**GET** `/api/report/turnover`

**Query 参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 YYYY-MM-DD，不传默认当月 1 日 |
| end_date | string | 否 | 结束日期 YYYY-MM-DD，不传默认当天 |

**响应**
```json
{
  "code": 0,
  "data": [
    {
      "product_id": 1,
      "product_name": "商品A",
      "avg_stock": 100,
      "outbound_quantity": 300,
      "turnover_rate": 3.0
    }
  ]
}
```

---

## 九、错误码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 401 | 未登录或 token 失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 422 | 参数校验失败 |
| 500 | 服务器错误 |

### 业务错误示例
```json
{
  "code": 422,
  "message": "库存不足，商品「商品A」当前库存 10，请求数量 20",
  "data": null
}
```
