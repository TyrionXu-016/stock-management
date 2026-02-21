# 库存管理后端服务 - 运行时通过 git 拉取代码
FROM python:3.11-slim

# 安装 git
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 预装依赖（加速启动，代码拉取后 pip install 会利用缓存）
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt \
    -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8800

ENTRYPOINT ["/entrypoint.sh"]
