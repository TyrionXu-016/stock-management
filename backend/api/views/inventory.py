"""
库存监控相关视图
"""
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Q, F

from ..models import (
    Product, StockLog, User,
    InventoryCheck, InventoryCheckItem,
)
from ..utils.response import success, error, paginated
from ..utils.order_no import gen_check_no


def _int_param(val, default=None):
    if val is None or val == '':
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


@require_http_methods(['GET'])
def list_inventory(request):
    """GET /api/inventory"""
    qs = Product.objects.filter(status=1).order_by('id')
    keyword = (request.GET.get('keyword') or '').strip()
    if keyword:
        qs = qs.filter(Q(name__icontains=keyword) | Q(sku_code__icontains=keyword))
    category_id = _int_param(request.GET.get('category_id'))
    if category_id is not None:
        qs = qs.filter(category_id=category_id)
    is_warning = _int_param(request.GET.get('is_warning'))
    if is_warning == 1:
        qs = qs.filter(min_stock__gt=0).filter(stock__lte=F('min_stock'))

    total = qs.count()
    page = max(1, _int_param(request.GET.get('page'), 1))
    page_size = min(100, max(1, _int_param(request.GET.get('page_size'), 20)))
    offset = (page - 1) * page_size
    items = list(qs[offset:offset + page_size])

    list_data = [{
        'product_id': p.id,
        'sku_code': p.sku_code,
        'product_name': p.name,
        'stock': p.stock,
        'min_stock': p.min_stock,
        'is_warning': p.min_stock > 0 and p.stock <= p.min_stock,
        'unit': p.unit or '件',
    } for p in items]
    return success(paginated(list_data, total, page, page_size))


@require_http_methods(['GET'])
def list_warning(request):
    """GET /api/inventory/warning"""
    qs = Product.objects.filter(
        status=1, min_stock__gt=0
    ).filter(stock__lte=F('min_stock')).order_by('stock')
    data = [{
        'product_id': p.id,
        'product_name': p.name,
        'sku_code': p.sku_code,
        'stock': p.stock,
        'min_stock': p.min_stock,
        'unit': p.unit or '件',
    } for p in qs]
    return success(data)


@require_http_methods(['GET'])
def list_logs(request):
    """GET /api/inventory/logs"""
    qs = StockLog.objects.all().order_by('-id')
    product_id = _int_param(request.GET.get('product_id'))
    if product_id is not None:
        qs = qs.filter(product_id=product_id)
    change_type = _int_param(request.GET.get('change_type'))
    if change_type is not None:
        qs = qs.filter(change_type=change_type)
    start_date = (request.GET.get('start_date') or '').strip()
    if start_date:
        qs = qs.filter(create_time__date__gte=start_date)
    end_date = (request.GET.get('end_date') or '').strip()
    if end_date:
        qs = qs.filter(create_time__date__lte=end_date)

    total = qs.count()
    page = max(1, _int_param(request.GET.get('page'), 1))
    page_size = min(100, max(1, _int_param(request.GET.get('page_size'), 20)))
    offset = (page - 1) * page_size
    logs = list(qs[offset:offset + page_size])

    product_ids = {l.product_id for l in logs}
    products = {p.id: p.name for p in Product.objects.filter(id__in=product_ids)} if product_ids else {}
    operator_ids = {l.operator_id for l in logs if l.operator_id}
    operators = {u.id: u.nickname for u in User.objects.filter(id__in=operator_ids)} if operator_ids else {}

    list_data = [{
        'id': l.id,
        'product_id': l.product_id,
        'product_name': products.get(l.product_id, ''),
        'change_type': l.change_type,
        'change_quantity': l.change_quantity,
        'before_stock': l.before_stock,
        'after_stock': l.after_stock,
        'related_id': l.related_id,
        'operator_name': operators.get(l.operator_id, ''),
        'remark': l.remark or '',
        'create_time': l.create_time.strftime('%Y-%m-%d %H:%M:%S') if l.create_time else None,
    } for l in logs]
    return success(paginated(list_data, total, page, page_size))


@require_http_methods(['GET'])
def list_checks(request):
    """GET /api/inventory/checks"""
    qs = InventoryCheck.objects.all().order_by('-id')
    status = _int_param(request.GET.get('status'))
    if status is not None:
        qs = qs.filter(status=status)

    total = qs.count()
    page = max(1, _int_param(request.GET.get('page'), 1))
    page_size = min(100, max(1, _int_param(request.GET.get('page_size'), 20)))
    offset = (page - 1) * page_size
    checks = list(qs[offset:offset + page_size])

    operator_ids = {c.operator_id for c in checks if c.operator_id}
    operators = {u.id: u.nickname for u in User.objects.filter(id__in=operator_ids)} if operator_ids else {}

    list_data = [{
        'id': c.id,
        'check_no': c.check_no,
        'operator_id': c.operator_id,
        'operator_name': operators.get(c.operator_id, ''),
        'status': c.status,
        'remark': c.remark or '',
        'create_time': c.create_time.strftime('%Y-%m-%d %H:%M:%S') if c.create_time else None,
    } for c in checks]
    return success(paginated(list_data, total, page, page_size))


@require_http_methods(['GET'])
def get_check(request, pk):
    """GET /api/inventory/checks/:id"""
    try:
        check = InventoryCheck.objects.get(pk=pk)
    except InventoryCheck.DoesNotExist:
        return error(404, '盘点单不存在')

    items = list(InventoryCheckItem.objects.filter(check_id=check.id))
    product_ids = {i.product_id for i in items}
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids)} if product_ids else {}
    operator_name = None
    if check.operator_id:
        try:
            operator_name = User.objects.get(pk=check.operator_id).nickname
        except User.DoesNotExist:
            pass

    item_list = []
    for i in items:
        p = products.get(i.product_id)
        item_list.append({
            'id': i.id,
            'product_id': i.product_id,
            'product_name': p.name if p else '',
            'book_stock': i.book_stock,
            'actual_stock': i.actual_stock,
            'diff_quantity': i.diff_quantity,
        })

    return success({
        'id': check.id,
        'check_no': check.check_no,
        'operator_id': check.operator_id,
        'operator_name': operator_name,
        'status': check.status,
        'remark': check.remark or '',
        'create_time': check.create_time.strftime('%Y-%m-%d %H:%M:%S') if check.create_time else None,
        'items': item_list,
    })


@csrf_exempt
@require_http_methods(['POST'])
def create_check(request):
    """POST /api/inventory/check 提交即完成"""
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    items_data = body.get('items') or []
    if not items_data:
        return error(422, '盘点明细不能为空')

    remark = (body.get('remark') or '')[:500]

    validated = []
    for it in items_data:
        product_id = _int_param(it.get('product_id'))
        if not product_id:
            return error(422, '商品ID不能为空')
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return error(422, f'商品 ID {product_id} 不存在')
        book = _int_param(it.get('book_stock'), 0)
        actual = _int_param(it.get('actual_stock'), 0)
        diff = actual - book
        validated.append({
            'product': product,
            'product_id': product_id,
            'book_stock': book,
            'actual_stock': actual,
            'diff_quantity': diff,
        })

    check_no = gen_check_no()
    with transaction.atomic():
        check = InventoryCheck.objects.create(
            check_no=check_no,
            operator_id=request.current_user.id,
            status=2,  # 提交即已完成
            remark=remark,
        )
        for v in validated:
            InventoryCheckItem.objects.create(
                check_id=check.id,
                product_id=v['product_id'],
                book_stock=v['book_stock'],
                actual_stock=v['actual_stock'],
                diff_quantity=v['diff_quantity'],
            )
            if v['diff_quantity'] != 0:
                product = v['product']
                before = product.stock
                after = before + v['diff_quantity']
                product.stock = max(0, after)
                product.save(update_fields=['stock', 'update_time'])
                StockLog.objects.create(
                    product_id=v['product_id'],
                    change_type=3,
                    change_quantity=v['diff_quantity'],
                    before_stock=before,
                    after_stock=product.stock,
                    related_id=check.id,
                    operator_id=request.current_user.id,
                    remark='盘点',
                )

    return success({
        'id': check.id,
        'check_no': check.check_no,
        'status': check.status,
    })
