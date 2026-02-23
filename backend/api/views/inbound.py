"""
入库单相关视图
"""
import json
from decimal import Decimal

from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from ..models import (
    InboundOrder, InboundItem, Product, ProductSku, StockLog, User,
)
from ..utils.response import success, error, paginated
from ..utils.order_no import gen_inbound_order_no


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
    except Exception:
        return default


def _inbound_to_dict(order, items=None, operator_name=None):
    """入库单转 dict"""
    d = {
        'id': order.id,
        'order_no': order.order_no,
        'supplier': order.supplier or '',
        'operator_id': order.operator_id,
        'operator_name': operator_name,
        'total_quantity': order.total_quantity,
        'total_amount': f'{float(order.total_amount or 0):.2f}',
        'status': order.status,
        'remark': order.remark or '',
        'create_time': order.create_time.strftime('%Y-%m-%d %H:%M:%S') if order.create_time else None,
        'items': [],
    }
    if items is not None:
        product_ids = [i.product_id for i in items]
        sku_ids = [i.sku_id for i in items if i.sku_id]
        products = {p.id: p for p in Product.objects.filter(id__in=product_ids)} if product_ids else {}
        skus = {s.id: s for s in ProductSku.objects.filter(id__in=sku_ids)} if sku_ids else {}
        for it in items:
            p = products.get(it.product_id)
            sku = skus.get(it.sku_id) if it.sku_id else None
            d['items'].append({
                'id': it.id,
                'product_id': it.product_id,
                'sku_id': it.sku_id,
                'size': sku.size if sku else None,
                'product_name': p.name if p else '',
                'sku_code': p.sku_code if p else '',
                'quantity': it.quantity,
                'unit_price': f'{float(it.unit_price or 0):.2f}',
                'total_price': f'{float(it.total_price or 0):.2f}',
                'batch_no': it.batch_no or '',
            })
    return d


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def inbound_list_or_create(request):
    """GET/POST /api/inbound"""
    if request.method == 'POST':
        return _create_inbound(request)
    qs = InboundOrder.objects.all().order_by('-id')
    status = _int_param(request.GET.get('status'))
    if status is not None:
        qs = qs.filter(status=status)
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
    orders = list(qs[offset:offset + page_size])

    operator_ids = {o.operator_id for o in orders if o.operator_id}
    operators = {u.id: u.nickname for u in User.objects.filter(id__in=operator_ids)} if operator_ids else {}

    list_data = []
    for order in orders:
        items = list(InboundItem.objects.filter(inbound_id=order.id))
        list_data.append(_inbound_to_dict(order, items, operators.get(order.operator_id)))

    return success(paginated(list_data, total, page, page_size))


@require_http_methods(['GET'])
def get_inbound(request, pk):
    """GET /api/inbound/:id"""
    try:
        order = InboundOrder.objects.get(pk=pk)
    except InboundOrder.DoesNotExist:
        return error(404, '入库单不存在')
    items = list(InboundItem.objects.filter(inbound_id=order.id))
    operator_name = None
    if order.operator_id:
        try:
            operator_name = User.objects.get(pk=order.operator_id).nickname
        except User.DoesNotExist:
            pass
    return success(_inbound_to_dict(order, items, operator_name))


@csrf_exempt
def _create_inbound(request):
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    items_data = body.get('items') or []
    if not items_data:
        return error(422, '入库明细不能为空')

    supplier = (body.get('supplier') or '')[:100]
    remark = body.get('remark') or ''

    # 校验：每条明细需 sku_id（或兼容仅 product_id 时取该商品第一个尺码）
    total_qty = 0
    total_amt = Decimal('0')
    validated_items = []
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
                    return error(422, f'商品「{product.name}」尚未配置尺码，请先添加尺码')
                sku_id = first_sku.id
            except Product.DoesNotExist:
                return error(422, f'商品 ID {product_id} 不存在')
        else:
            return error(422, '每条明细需提供 sku_id 或 product_id')
        qty = _int_param(it.get('quantity'), 0)
        if qty <= 0:
            return error(422, f'商品 {product.name} 数量必须大于 0')
        price = _decimal_param(it.get('unit_price'))
        sub_total = Decimal(str(qty)) * price
        total_qty += qty
        total_amt += sub_total
        validated_items.append({
            'product_id': product_id,
            'sku_id': sku_id,
            'product_name': product.name,
            'quantity': qty,
            'unit_price': price,
            'total_price': sub_total,
            'batch_no': (it.get('batch_no') or '')[:50] or None,
        })

    order_no = gen_inbound_order_no()
    with transaction.atomic():
        order = InboundOrder.objects.create(
            order_no=order_no,
            supplier=supplier,
            operator_id=request.current_user.id,
            total_quantity=total_qty,
            total_amount=total_amt,
            status=1,
            remark=remark,
        )
        for v in validated_items:
            InboundItem.objects.create(
                inbound_id=order.id,
                product_id=v['product_id'],
                sku_id=v['sku_id'],
                quantity=v['quantity'],
                unit_price=v['unit_price'],
                total_price=v['total_price'],
                batch_no=v['batch_no'],
            )

    items = list(InboundItem.objects.filter(inbound_id=order.id))
    return success(_inbound_to_dict(order, items, request.current_user.nickname))


@csrf_exempt
@require_http_methods(['PUT'])
def update_inbound_status(request, pk):
    """PUT /api/inbound/:id/status 审批"""
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')
    if request.current_user.role != 2:
        return error(403, '需要管理员权限')

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    new_status = _int_param(body.get('status'))
    if new_status not in (2, 3):
        return error(422, 'status 必须为 2(通过) 或 3(拒绝)')

    try:
        order = InboundOrder.objects.get(pk=pk)
    except InboundOrder.DoesNotExist:
        return error(404, '入库单不存在')

    if order.status != 1:
        return error(422, '只有待审批的入库单可以审批')

    if new_status == 2:
        with transaction.atomic():
            order.status = 2
            order.save(update_fields=['status', 'update_time'])
            items = InboundItem.objects.filter(inbound_id=order.id)
            for it in items:
                sku_id = it.sku_id
                if sku_id:
                    sku = ProductSku.objects.get(pk=sku_id)
                    before = sku.stock
                    after = before + it.quantity
                    sku.stock = after
                    sku.save(update_fields=['stock', 'update_time'])
                    product_id = sku.product_id
                else:
                    product = Product.objects.get(pk=it.product_id)
                    before = product.stock
                    after = before + it.quantity
                    product.stock = after
                    product.save(update_fields=['stock', 'update_time'])
                    product_id = product.id
                StockLog.objects.create(
                    product_id=product_id,
                    sku_id=sku_id,
                    change_type=1,
                    change_quantity=it.quantity,
                    before_stock=before,
                    after_stock=after,
                    related_id=order.id,
                    operator_id=request.current_user.id,
                    remark='入库',
                )
    else:
        order.status = 3
        order.save(update_fields=['status', 'update_time'])

    return success({'status': order.status})
