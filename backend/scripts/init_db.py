#!/usr/bin/env python
"""
使用 PyMySQL 初始化远程 MySQL 数据库
连接 server_info.md 中的数据库，执行 database/schema.sql
"""
import os
import sys
from pathlib import Path

# 添加 backend 到 path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

import pymysql

# 数据库配置（与 settings 一致，可从环境变量覆盖）
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', '114.55.139.240'),
    'port': int(os.environ.get('DB_PORT', 3306)),
    'user': os.environ.get('DB_USER', 'stock_user'),
    'password': os.environ.get('DB_PASSWORD', 'Stock@2024'),
    'charset': 'utf8mb4',
}

SCHEMA_PATH = backend_dir.parent / 'database' / 'schema.sql'


def main():
    print('连接 MySQL...')
    conn = pymysql.connect(**DB_CONFIG)
    try:
        sql = SCHEMA_PATH.read_text(encoding='utf-8')
        # 移除注释行
        lines = [l for l in sql.split('\n') if not l.strip().startswith('--')]
        sql = '\n'.join(lines)
        # 按分号分割语句
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        print(f'执行 {len(statements)} 条 SQL 语句...')
        with conn.cursor() as cur:
            for stmt in statements:
                stmt = stmt.strip()
                if stmt:
                    cur.execute(stmt)
        conn.commit()
        print('数据库初始化完成')
    finally:
        conn.close()


if __name__ == '__main__':
    main()
