-- 按鞋码区分库存：新增商品尺码表，入库/出库/流水/盘点明细增加 sku_id
-- 执行前请备份数据库。执行后需运行 backfill_product_sku.sql 做数据迁移。

USE stock_manager;

-- 1. 商品尺码表（一款商品多个尺码，每个尺码独立库存）
CREATE TABLE IF NOT EXISTS t_product_sku (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL COMMENT '商品ID',
  size VARCHAR(20) NOT NULL COMMENT '鞋码/尺码，如 38,39,40 或 均码',
  stock INT DEFAULT 0 COMMENT '当前库存',
  min_stock INT DEFAULT 0 COMMENT '最低库存预警',
  max_stock INT DEFAULT 0 COMMENT '最高库存',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_size (product_id, size),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品尺码库存表';

-- 2. 入库单明细增加 sku_id（优先使用 sku_id，无则兼容旧数据用 product_id）
ALTER TABLE t_inbound_item
  ADD COLUMN sku_id BIGINT DEFAULT NULL COMMENT '商品尺码ID' AFTER product_id,
  ADD KEY idx_sku (sku_id);

-- 3. 出库单明细增加 sku_id
ALTER TABLE t_outbound_item
  ADD COLUMN sku_id BIGINT DEFAULT NULL COMMENT '商品尺码ID' AFTER product_id,
  ADD KEY idx_sku (sku_id);

-- 4. 库存变动记录增加 sku_id
ALTER TABLE t_stock_log
  ADD COLUMN sku_id BIGINT DEFAULT NULL COMMENT '商品尺码ID' AFTER product_id,
  ADD KEY idx_sku (sku_id);

-- 5. 盘点明细增加 sku_id
ALTER TABLE t_inventory_check_item
  ADD COLUMN sku_id BIGINT DEFAULT NULL COMMENT '商品尺码ID' AFTER product_id,
  ADD KEY idx_sku (sku_id);
