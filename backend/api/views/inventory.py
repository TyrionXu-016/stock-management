"""
库存监控相关视图
"""
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Q, F

from ..models import (
    Product, ProductSku, StockLog, User,
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
    """GET /api/inventory 按商品尺码列出（每款每码一行）"""
    prod_qs = Product.objects.filter(status=1)
    keyword = (request.GET.get('keyword') or '').strip()
    if keyword:
        prod_qs = prod_qs.filter(Q(name__icontains=keyword) | Q(sku_code__icontains=keyword))
    category_id = _int_param(request.GET.get('category_id'))
    if category_id is not None:
        prod_qs = prod_qs.filter(category_id=category_id)
    product_ids = list(prod_qs.values_list('id', flat=True))
    qs = ProductSku.objects.filter(product_id__in=product_ids).order_by('product_id', 'size')
    is_warning = _int_param(request.GET.get('is_warning'))
    if is_warning == 1:
        qs = qs.filter(min_stock__gt=0).filter(stock__lte=F('min_stock'))

    total = qs.count()
    page = max(1, _int_param(request.GET.get('page'), 1))
    page_size = min(100, max(1, _int_param(request.GET.get('page_size'), 20)))
    offset = (page - 1) * page_size
    rows = list(qs[offset:offset + page_size])
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids)}

    list_data = []
    for s in rows:
        p = products.get(s.product_id)
        if not p:
            continue
        list_data.append({
            'product_id': p.id,
            'sku_id': s.id,
            'sku_code': p.sku_code,
            'product_name': p.name,
            'size': s.size,
            'stock': s.stock,
            'min_stock': s.min_stock,
            'is_warning': s.min_stock > 0 and s.stock <= s.min_stock,
            'unit': p.unit or '件',
        })
    return success(paginated(list_data, total, page, page_size))


@require_http_methods(['GET'])
def list_warning(request):
    """GET /api/inventory/warning 按尺码预警"""
    qs = ProductSku.objects.filter(min_stock__gt=0).filter(stock__lte=F('min_stock')).order_by('stock')
    product_ids = list(qs.values_list('product_id', flat=True).distinct())
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids, status=1)} if product_ids else {}
    data = []
    for s in qs:
        p = products.get(s.product_id)
        if not p:
            continue
        data.append({
            'product_id': p.id,
            'sku_id': s.id,
            'product_name': p.name,
            'sku_code': p.sku_code,
            'size': s.size,
            'stock': s.stock,
            'min_stock': s.min_stock,
            'unit': p.unit or '件',
        })
    return success(data)


@require_http_methods(['GET'])
def list_logs(request):
    """GET /api/inventory/logs"""
    qs = StockLog.objects.all().order_by('-id')
    product_id = _int_param(request.GET.get('product_id'))
    sku_id = _int_param(request.GET.get('sku_id'))
    if product_id is not None:
        qs = qs.filter(product_id=product_id)
    if sku_id is not None:
        qs = qs.filter(sku_id=sku_id)
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
    sku_ids = {l.sku_id for l in logs if l.sku_id}
    products = {p.id: p.name for p in Product.objects.filter(id__in=product_ids)} if product_ids else {}
    skus = {s.id: s.size for s in ProductSku.objects.filter(id__in=sku_ids)} if sku_ids else {}
    operator_ids = {l.operator_id for l in logs if l.operator_id}
    operators = {u.id: u.nickname for u in User.objects.filter(id__in=operator_ids)} if operator_ids else {}

    list_data = [{
        'id': l.id,
        'product_id': l.product_id,
        'sku_id': l.sku_id,
        'size': skus.get(l.sku_id) if l.sku_id else None,
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
    sku_ids = {i.sku_id for i in items if i.sku_id}
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids)} if product_ids else {}
    skus = {s.id: s for s in ProductSku.objects.filter(id__in=sku_ids)} if sku_ids else {}
    operator_name = None
    if check.operator_id:
        try:
            operator_name = User.objects.get(pk=check.operator_id).nickname
        except User.DoesNotExist:
            pass

    item_list = []
    for i in items:
        p = products.get(i.product_id)
        sku = skus.get(i.sku_id) if i.sku_id else None
        item_list.append({
            'id': i.id,
            'product_id': i.product_id,
            'sku_id': i.sku_id,
            'size': sku.size if sku else None,
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
        sku_id = _int_param(it.get('sku_id'))
        product_id = _int_param(it.get('product_id'))
        if sku_id:
            try:
                sku = ProductSku.objects.get(pk=sku_id)
                product = Product.objects.get(pk=sku.product_id)
                product_id = product.id
            except (ProductSku.DoesNotExist, Product.DoesNotExist):
                return error(422, f'尺码 ID {sku_id} 不存在')
        elif product_id:
            try:
                product = Product.objects.get(pk=product_id)
                first_sku = ProductSku.objects.filter(product_id=product_id).order_by('id').first()
                if not first_sku:
                    return error(422, f'商品「{product.name}」尚未配置尺码')
                sku_id = first_sku.id
                sku = first_sku
            except Product.DoesNotExist:
                return error(422, f'商品 ID {product_id} 不存在')
        else:
            return error(422, '每条明细需提供 sku_id 或 product_id')
        book = _int_param(it.get('book_stock'), 0)
        actual = _int_param(it.get('actual_stock'), 0)
        diff = actual - book
        validated.append({
            'product_id': product_id,
            'sku_id': sku_id,
            'sku': sku,
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
                sku_id=v['sku_id'],
                book_stock=v['book_stock'],
                actual_stock=v['actual_stock'],
                diff_quantity=v['diff_quantity'],
            )
            if v['diff_quantity'] != 0:
                sku = v['sku']
                before = sku.stock
                after = max(0, before + v['diff_quantity'])
                sku.stock = after
                sku.save(update_fields=['stock', 'update_time'])
                StockLog.objects.create(
                    product_id=v['product_id'],
                    sku_id=v['sku_id'],
                    change_type=3,
                    change_quantity=v['diff_quantity'],
                    before_stock=before,
                    after_stock=after,
                    related_id=check.id,
                    operator_id=request.current_user.id,
                    remark='盘点',
                )

    return success({
        'id': check.id,
        'check_no': check.check_no,
        'status': check.status,
    })
