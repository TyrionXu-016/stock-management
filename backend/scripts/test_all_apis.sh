#!/bin/bash
# 全量接口测试脚本
# 需先启动: python manage.py runserver
# 需先获取 TOKEN（管理员）: python scripts/get_test_token.py

BASE="http://127.0.0.1:8000"
TOKEN="${TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "请设置 TOKEN 环境变量，或运行: TOKEN=\$(python scripts/get_test_token.py) ./scripts/test_all_apis.sh"
  TOKEN=$(cd "$(dirname "$0")/.." && source venv/bin/activate 2>/dev/null && python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_manager.settings')
django.setup()
from api.models import User
from api.utils.jwt_util import encode
u, _ = User.objects.get_or_create(openid='test_openid_001', defaults={'nickname':'测试','role':2,'status':1})
u.role = 2
u.save()
print(encode(u.id))
" 2>/dev/null)
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
OK=0
FAIL=0

check() {
  local name="$1"
  local res="$2"
  local expect="$3"
  if echo "$res" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('code')==$expect else 1)" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $name"
    ((OK++))
    return 0
  else
    echo -e "${RED}✗${NC} $name"
    echo "  Response: $(echo "$res" | head -c 200)"
    ((FAIL++))
    return 1
  fi
}

echo "===== 第一阶段：认证与用户 ====="
res=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"code":"invalid"}')
check "POST /api/auth/login (invalid code)" "$res" 401

res=$(curl -s "$BASE/api/user/profile" -H "Authorization: Bearer $TOKEN")
check "GET /api/user/profile" "$res" 0

res=$(curl -s -X PUT "$BASE/api/user/profile" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nickname":"测试用户"}')
check "PUT /api/user/profile" "$res" 0

res=$(curl -s "$BASE/api/report/overview" -H "Authorization: Bearer $TOKEN")
check "GET /api/report/overview" "$res" 0

echo ""
echo "===== 第二阶段：分类与商品 ====="
res=$(curl -s "$BASE/api/categories")
check "GET /api/categories" "$res" 0

res=$(curl -s -X POST "$BASE/api/categories" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"测试分类","parent_id":0,"sort":1}')
check "POST /api/categories" "$res" 0

res=$(curl -s "$BASE/api/products")
check "GET /api/products" "$res" 0

res=$(curl -s -X POST "$BASE/api/products" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"sku_code":"SKU002","name":"商品B","unit":"件","purchase_price":5,"sale_price":8}')
check "POST /api/products" "$res" 0

res=$(curl -s "$BASE/api/products/1")
check "GET /api/products/1" "$res" 0

echo ""
echo "===== 第三阶段：入库与出库 ====="
res=$(curl -s "$BASE/api/inbound")
check "GET /api/inbound" "$res" 0

res=$(curl -s -X POST "$BASE/api/inbound" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"supplier":"供","items":[{"product_id":1,"quantity":10,"unit_price":10}]}')
check "POST /api/inbound" "$res" 0

res=$(curl -s "$BASE/api/inbound/1" -H "Authorization: Bearer $TOKEN")
check "GET /api/inbound/1" "$res" 0

# 获取最新入库单 id
INBOUND_ID=$(curl -s "$BASE/api/inbound?page_size=1" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['list'][0]['id'] if d.get('code')==0 and d['data']['list'] else 1)" 2>/dev/null || echo "1")
res=$(curl -s -X PUT "$BASE/api/inbound/$INBOUND_ID/status" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":2}')
check "PUT /api/inbound/$INBOUND_ID/status (approve)" "$res" 0

res=$(curl -s "$BASE/api/outbound")
check "GET /api/outbound" "$res" 0

res=$(curl -s -X POST "$BASE/api/outbound" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"receiver":"客","items":[{"product_id":1,"quantity":5,"unit_price":15}]}')
check "POST /api/outbound" "$res" 0

OUTBOUND_ID=$(curl -s "$BASE/api/outbound?page_size=1" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['list'][0]['id'] if d.get('code')==0 and d['data']['list'] else 1)" 2>/dev/null || echo "1")
res=$(curl -s -X PUT "$BASE/api/outbound/$OUTBOUND_ID/status" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":2}')
check "PUT /api/outbound/$OUTBOUND_ID/status" "$res" 0

echo ""
echo "===== 第四阶段：库存与盘点 ====="
res=$(curl -s "$BASE/api/inventory")
check "GET /api/inventory" "$res" 0

res=$(curl -s "$BASE/api/inventory/warning")
check "GET /api/inventory/warning" "$res" 0

res=$(curl -s "$BASE/api/inventory/logs?page_size=5")
check "GET /api/inventory/logs" "$res" 0

res=$(curl -s -X POST "$BASE/api/inventory/check" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"remark":"测试","items":[{"product_id":1,"book_stock":90,"actual_stock":88}]}')
check "POST /api/inventory/check" "$res" 0

res=$(curl -s "$BASE/api/inventory/checks")
check "GET /api/inventory/checks" "$res" 0

res=$(curl -s "$BASE/api/inventory/checks/1")
check "GET /api/inventory/checks/1" "$res" 0

echo ""
echo "===== 第五阶段：报表统计 ====="
res=$(curl -s "$BASE/api/report/overview" -H "Authorization: Bearer $TOKEN")
check "GET /api/report/overview (full)" "$res" 0

res=$(curl -s "$BASE/api/report/inbound" -H "Authorization: Bearer $TOKEN")
check "GET /api/report/inbound" "$res" 0

res=$(curl -s "$BASE/api/report/outbound" -H "Authorization: Bearer $TOKEN")
check "GET /api/report/outbound" "$res" 0

res=$(curl -s "$BASE/api/report/turnover" -H "Authorization: Bearer $TOKEN")
check "GET /api/report/turnover" "$res" 0

echo ""
echo "===== 汇总 ====="
echo -e "通过: ${GREEN}$OK${NC}  失败: ${RED}$FAIL${NC}"
exit $FAIL
