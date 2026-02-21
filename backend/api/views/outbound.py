"""
出库单相关视图
"""
import json
from decimal import Decimal

from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from ..models import (
    OutboundOrder, OutboundItem, Product, StockLog, User,
)
from ..utils.response import success, error, paginated
from ..utils.order_no import gen_outbound_order_no


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


def _outbound_to_dict(order, items=None, operator_name=None):
    """出库单转 dict"""
    d = {
        'id': order.id,
        'order_no': order.order_no,
        'receiver': order.receiver or '',
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
        products = {p.id: p for p in Product.objects.filter(id__in=[i.product_id for i in items])}
        for it in items:
            p = products.get(it.product_id)
            d['items'].append({
                'id': it.id,
                'product_id': it.product_id,
                'product_name': p.name if p else '',
                'sku_code': p.sku_code if p else '',
                'quantity': it.quantity,
                'unit_price': f'{float(it.unit_price or 0):.2f}',
                'total_price': f'{float(it.total_price or 0):.2f}',
            })
    return d


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def outbound_list_or_create(request):
    """GET/POST /api/outbound"""
    if request.method == 'POST':
        return _create_outbound(request)
    qs = OutboundOrder.objects.all().order_by('-id')
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
        items = list(OutboundItem.objects.filter(outbound_id=order.id))
        list_data.append(_outbound_to_dict(order, items, operators.get(order.operator_id)))

    return success(paginated(list_data, total, page, page_size))


@require_http_methods(['GET'])
def get_outbound(request, pk):
    """GET /api/outbound/:id"""
    try:
        order = OutboundOrder.objects.get(pk=pk)
    except OutboundOrder.DoesNotExist:
        return error(404, '出库单不存在')
    items = list(OutboundItem.objects.filter(outbound_id=order.id))
    operator_name = None
    if order.operator_id:
        try:
            operator_name = User.objects.get(pk=order.operator_id).nickname
        except User.DoesNotExist:
            pass
    return success(_outbound_to_dict(order, items, operator_name))


@csrf_exempt
def _create_outbound(request):
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    items_data = body.get('items') or []
    if not items_data:
        return error(422, '出库明细不能为空')

    receiver = (body.get('receiver') or '')[:100]
    remark = body.get('remark') or ''

    # 校验商品存在、库存充足并计算
    total_qty = 0
    total_amt = Decimal('0')
    validated_items = []
    for it in items_data:
        product_id = _int_param(it.get('product_id'))
        if not product_id:
            return error(422, '商品ID不能为空')
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return error(422, f'商品 ID {product_id} 不存在')
        qty = _int_param(it.get('quantity'), 0)
        if qty <= 0:
            return error(422, f'商品 {product.name} 数量必须大于 0')
        if product.stock < qty:
            return error(422, f'库存不足，商品「{product.name}」当前库存 {product.stock}，请求数量 {qty}')
        price = _decimal_param(it.get('unit_price'))
        sub_total = Decimal(str(qty)) * price
        total_qty += qty
        total_amt += sub_total
        validated_items.append({
            'product_id': product_id,
            'product_name': product.name,
            'quantity': qty,
            'unit_price': price,
            'total_price': sub_total,
        })

    order_no = gen_outbound_order_no()
    with transaction.atomic():
        order = OutboundOrder.objects.create(
            order_no=order_no,
            receiver=receiver,
            operator_id=request.current_user.id,
            total_quantity=total_qty,
            total_amount=total_amt,
            status=1,
            remark=remark,
        )
        for v in validated_items:
            OutboundItem.objects.create(
                outbound_id=order.id,
                product_id=v['product_id'],
                quantity=v['quantity'],
                unit_price=v['unit_price'],
                total_price=v['total_price'],
            )

    items = list(OutboundItem.objects.filter(outbound_id=order.id))
    return success(_outbound_to_dict(order, items, request.current_user.nickname))


@csrf_exempt
@require_http_methods(['PUT'])
def update_outbound_status(request, pk):
    """PUT /api/outbound/:id/status 审批"""
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
        order = OutboundOrder.objects.get(pk=pk)
    except OutboundOrder.DoesNotExist:
        return error(404, '出库单不存在')

    if order.status != 1:
        return error(422, '只有待审批的出库单可以审批')

    if new_status == 2:
        with transaction.atomic():
            items = list(OutboundItem.objects.filter(outbound_id=order.id))
            for it in items:
                product = Product.objects.get(pk=it.product_id)
                if product.stock < it.quantity:
                    return error(422, f'库存不足，商品「{product.name}」当前库存 {product.stock}，出库数量 {it.quantity}')
            order.status = 2
            order.save(update_fields=['status', 'update_time'])
            for it in items:
                product = Product.objects.get(pk=it.product_id)
                before = product.stock
                after = before - it.quantity
                product.stock = after
                product.save(update_fields=['stock', 'update_time'])
                StockLog.objects.create(
                    product_id=it.product_id,
                    change_type=2,
                    change_quantity=-it.quantity,
                    before_stock=before,
                    after_stock=after,
                    related_id=order.id,
                    operator_id=request.current_user.id,
                    remark='出库',
                )
    else:
        order.status = 3
        order.save(update_fields=['status', 'update_time'])

    return success({'status': order.status})
