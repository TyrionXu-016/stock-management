-- 库存管理微信小程序 - 数据库表结构
-- 连接信息见项目根目录 server_info.md

CREATE DATABASE IF NOT EXISTS stock_manager DEFAULT CHARSET utf8mb4;
USE stock_manager;

-- 用户表
CREATE TABLE IF NOT EXISTS t_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(64) NOT NULL,
  unionid VARCHAR(64) DEFAULT NULL,
  nickname VARCHAR(100) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role TINYINT DEFAULT 1 COMMENT '1:普通用户 2:管理员',
  status TINYINT DEFAULT 1 COMMENT '1:正常 2:禁用',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 商品分类表
CREATE TABLE IF NOT EXISTS t_category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  parent_id INT DEFAULT 0 COMMENT '0为顶级分类',
  sort INT DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 商品表
CREATE TABLE IF NOT EXISTS t_product (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sku_code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  spec VARCHAR(100) DEFAULT NULL,
  category_id INT DEFAULT NULL,
  brand VARCHAR(100) DEFAULT NULL,
  unit VARCHAR(20) DEFAULT '件',
  purchase_price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) DEFAULT 0,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 0 COMMENT '最低库存预警值',
  max_stock INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '1:正常 2:下架',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sku_code (sku_code),
  KEY idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 入库单表
CREATE TABLE IF NOT EXISTS t_inbound_order (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  supplier VARCHAR(100) DEFAULT NULL,
  operator_id BIGINT DEFAULT NULL,
  total_quantity INT DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '1:待审批 2:已确认 3:已拒绝',
  remark TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 入库单明细表
CREATE TABLE IF NOT EXISTS t_inbound_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inbound_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  batch_no VARCHAR(50) DEFAULT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_inbound (inbound_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 出库单表
CREATE TABLE IF NOT EXISTS t_outbound_order (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  receiver VARCHAR(100) DEFAULT NULL,
  operator_id BIGINT DEFAULT NULL,
  total_quantity INT DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '1:待审批 2:已确认 3:已拒绝',
  remark TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 出库单明细表
CREATE TABLE IF NOT EXISTS t_outbound_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  outbound_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_outbound (outbound_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 库存变动记录表
CREATE TABLE IF NOT EXISTS t_stock_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT NOT NULL,
  change_type TINYINT NOT NULL COMMENT '1:入库 2:出库 3:盘点',
  change_quantity INT NOT NULL COMMENT '正数为增，负数为减',
  before_stock INT DEFAULT 0,
  after_stock INT DEFAULT 0,
  related_id BIGINT DEFAULT NULL,
  operator_id BIGINT DEFAULT NULL,
  remark VARCHAR(500) DEFAULT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_product (product_id),
  KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 盘点单表
CREATE TABLE IF NOT EXISTS t_inventory_check (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  check_no VARCHAR(50) NOT NULL,
  operator_id BIGINT DEFAULT NULL,
  status TINYINT DEFAULT 1 COMMENT '1:进行中 2:已完成',
  remark TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_check_no (check_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 盘点明细表
CREATE TABLE IF NOT EXISTS t_inventory_check_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  check_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  book_stock INT DEFAULT 0 COMMENT '账面库存',
  actual_stock INT DEFAULT 0 COMMENT '实际库存',
  diff_quantity INT DEFAULT 0 COMMENT '差异数量',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_check (check_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
