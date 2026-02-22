-- 商品表添加图片字段
-- 执行: mysql -h <Host> -u <User> -p < database/migrations/add_product_image.sql

USE stock_manager;

ALTER TABLE t_product ADD COLUMN cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL' AFTER max_stock;
