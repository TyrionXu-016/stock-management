"""单号生成"""
from datetime import datetime
from django.db.models import Max

from ..models import InboundOrder, OutboundOrder, InventoryCheck


def _next_seq(model_class, prefix, date_str, field='order_no'):
    """获取当日流水号"""
    prefix_full = prefix + date_str
    filter_kw = {f'{field}__startswith': prefix_full}
    agg_kw = {f'm': Max(field)}
    last = model_class.objects.filter(**filter_kw).aggregate(**agg_kw)['m']
    if not last:
        return 1
    try:
        return int(last[-4:]) + 1
    except ValueError:
        return 1


def gen_inbound_order_no():
    """生成入库单号 IN202401010001"""
    date_str = datetime.now().strftime('%Y%m%d')
    seq = _next_seq(InboundOrder, 'IN', date_str)
    return f'IN{date_str}{seq:04d}'


def gen_outbound_order_no():
    """生成出库单号 OUT202401010001"""
    date_str = datetime.now().strftime('%Y%m%d')
    seq = _next_seq(OutboundOrder, 'OUT', date_str)
    return f'OUT{date_str}{seq:04d}'


def gen_check_no():
    """生成盘点单号 CHK202401010001"""
    date_str = datetime.now().strftime('%Y%m%d')
    seq = _next_seq(InventoryCheck, 'CHK', date_str, field='check_no')
    return f'CHK{date_str}{seq:04d}'
