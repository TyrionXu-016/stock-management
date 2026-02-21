"""
商品相关视图
"""
import json
from decimal import Decimal, InvalidOperation
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q

from ..models import Product, Category
from ..utils.response import success, error, paginated


def _int_param(val, default=None):
    if val is None or val == '':
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def _decimal_param(val, default=0):
    if val is None or val == '':
        return default
    try:
        return Decimal(str(val))
    except (InvalidOperation, TypeError, ValueError):
        return default


def _product_from_body(body, is_create=False):
    """从请求体解析商品字段。is_create 必填 name、sku_code；更新时只包含 body 中有的字段"""
    data = {}
    if is_create:
        sku = (body.get('sku_code') or '').strip()
        if not sku:
            raise ValueError('SKU 不能为空')
        data['sku_code'] = sku[:50]
    if is_create or 'name' in body:
        name = (body.get('name') or '').strip()
        if is_create and not name:
            raise ValueError('商品名称不能为空')
        data['name'] = name[:200] if name else ''
    if is_create or 'spec' in body:
        data['spec'] = (body.get('spec') or '')[:100] or None
    if is_create or 'category_id' in body:
        data['category_id'] = _int_param(body.get('category_id'), None)
    if is_create or 'brand' in body:
        data['brand'] = (body.get('brand') or '')[:100] or None
    if is_create or 'unit' in body:
        data['unit'] = (body.get('unit') or '件')[:20]
    if is_create or 'purchase_price' in body:
        data['purchase_price'] = _decimal_param(body.get('purchase_price'))
    if is_create or 'sale_price' in body:
        data['sale_price'] = _decimal_param(body.get('sale_price'))
    if is_create or 'min_stock' in body:
        data['min_stock'] = _int_param(body.get('min_stock'), 0)
    if is_create or 'max_stock' in body:
        data['max_stock'] = _int_param(body.get('max_stock'), 0)
    if not is_create and 'status' in body:
        s = body.get('status')
        data['status'] = 1 if s is not None and int(s) == 1 else 2
    return data


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def products(request):
    """
    GET/POST /api/products
    GET Query: keyword, category_id, status, page, page_size
    POST body: 创建商品
    """
    if request.method == 'POST':
        return _create_product(request)

    qs = Product.objects.all()
    keyword = (request.GET.get('keyword') or '').strip()
    if keyword:
        qs = qs.filter(Q(name__icontains=keyword) | Q(sku_code__icontains=keyword))
    category_id = _int_param(request.GET.get('category_id'))
    if category_id is not None:
        qs = qs.filter(category_id=category_id)
    status = _int_param(request.GET.get('status'))
    if status is not None:
        qs = qs.filter(status=status)

    total = qs.count()
    page = max(1, _int_param(request.GET.get('page'), 1))
    page_size = min(100, max(1, _int_param(request.GET.get('page_size'), 20)))
    offset = (page - 1) * page_size
    items = qs.order_by('-id')[offset:offset + page_size]

    # 预取分类名
    cat_ids = {p.category_id for p in items if p.category_id}
    cats = {c.id: c.name for c in Category.objects.filter(id__in=cat_ids)} if cat_ids else {}

    list_data = [
        p.to_dict(category_name=cats.get(p.category_id))
        for p in items
    ]
    return success(paginated(list_data, total, page, page_size))


@csrf_exempt
@require_http_methods(['GET', 'PUT', 'DELETE'])
def product_detail(request, pk):
    """GET/PUT/DELETE /api/products/:id"""
    try:
        obj = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return error(404, '商品不存在')

    if request.method == 'GET':
        return success(obj.to_dict())
    if request.method == 'PUT':
        if not getattr(request, 'current_user', None):
            return error(401, '未登录或 token 已失效')
        return _update_product(request, pk)
    if request.method == 'DELETE':
        if not getattr(request, 'current_user', None):
            return error(401, '未登录或 token 已失效')
        if request.current_user.role != 2:
            return error(403, '需要管理员权限')
        return _delete_product(request, pk)
    return error(405, 'Method Not Allowed')


def _create_product(request):
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    try:
        data = _product_from_body(body, is_create=True)
    except ValueError as e:
        return error(422, str(e))

    if Product.objects.filter(sku_code=data['sku_code']).exists():
        return error(422, f'SKU {data["sku_code"]} 已存在')

    obj = Product.objects.create(**data)
    return success(obj.to_dict())


def _update_product(request, pk):
    try:
        obj = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return error(404, '商品不存在')

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    try:
        data = _product_from_body(body, is_create=False)
    except ValueError as e:
        return error(422, str(e))

    for k, v in data.items():
        setattr(obj, k, v)
    obj.save()
    return success(obj.to_dict())


def _delete_product(request, pk):
    try:
        obj = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return error(404, '商品不存在')
    obj.delete()
    return success()
