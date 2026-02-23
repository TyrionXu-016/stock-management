-- 数据迁移：为每个现有商品创建一条尺码记录（尺码取 spec 或「均码」），并回填明细表的 sku_id
-- 请在 add_product_sku.sql 执行成功后执行本脚本。

USE stock_manager;

-- 1. 为每个商品创建一条尺码记录，库存从 t_product 拷贝
INSERT INTO t_product_sku (product_id, size, stock, min_stock, max_stock)
SELECT id, COALESCE(NULLIF(TRIM(spec), ''), '均码'), stock, min_stock, max_stock
FROM t_product
ON DUPLICATE KEY UPDATE size = VALUES(size);

-- 2. 回填入库单明细的 sku_id（按 product_id 匹配该商品下唯一/第一条 sku）
UPDATE t_inbound_item i
INNER JOIN t_product_sku s ON s.product_id = i.product_id
SET i.sku_id = s.id
WHERE i.sku_id IS NULL;

-- 3. 回填出库单明细的 sku_id
UPDATE t_outbound_item i
INNER JOIN t_product_sku s ON s.product_id = i.product_id
SET i.sku_id = s.id
WHERE i.sku_id IS NULL;

-- 4. 回填盘点明细的 sku_id（同一商品可能有多条 sku，取第一条，仅用于历史数据）
UPDATE t_inventory_check_item i
INNER JOIN (
  SELECT product_id, MIN(id) AS sku_id FROM t_product_sku GROUP BY product_id
) s ON s.product_id = i.product_id
SET i.sku_id = s.sku_id
WHERE i.sku_id IS NULL;

-- 5. 回填库存变动记录的 sku_id（历史流水取该商品第一个 sku）
UPDATE t_stock_log l
INNER JOIN (
  SELECT product_id, MIN(id) AS sku_id FROM t_product_sku GROUP BY product_id
) s ON s.product_id = l.product_id
SET l.sku_id = s.sku_id
WHERE l.sku_id IS NULL;
