# 按鞋码区分库存 - 迁移说明

## 1. 执行顺序

1. **add_product_sku.sql**  
   创建 `t_product_sku` 表，并在入库/出库/流水/盘点明细表中增加 `sku_id` 字段。

2. **backfill_product_sku.sql**  
   为每个现有商品生成一条尺码记录（尺码取自 `spec`，为空则用「均码」），并回填各明细表的 `sku_id`。

## 2. 执行方式

```bash
# 在项目根目录或 database 目录下执行（替换为实际连接参数）
mysql -h <Host> -u <User> -p < database/migrations/add_product_sku.sql
mysql -h <Host> -u <User> -p < database/migrations/backfill_product_sku.sql
```

## 3. 迁移后行为

- **商品**：库存按「尺码」维护在 `t_product_sku`，商品详情/列表中的库存为各尺码库存之和。
- **入库/出库**：每条明细需带 `sku_id`（或仅 `product_id` 时取该商品第一个尺码），确认后只改对应尺码库存。
- **盘点**：按尺码盘点，每条明细对应一个 `sku_id`。
- **预警与报表**：按尺码统计与预警。

## 4. 回滚（仅作参考，慎用）

如需回滚，需自行备份后删除 `sku_id` 列并 drop `t_product_sku`；业务逻辑已按尺码设计，回滚后需恢复旧版后端与小程序。
