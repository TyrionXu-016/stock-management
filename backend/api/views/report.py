"""
报表相关视图
"""
from django.views.decorators.http import require_http_methods
from django.db import connection

from ..models import Product
from ..utils.response import success, error


def _require_auth(view_func):
    def wrapper(request, *args, **kwargs):
        if not getattr(request, 'current_user', None):
            return error(401, '未登录或 token 已失效')
        return view_func(request, *args, **kwargs)
    return wrapper


def _date_range(request):
    """获取 start_date, end_date，不传默认当月"""
    from datetime import date
    today = date.today()
    start = (request.GET.get('start_date') or '').strip()
    end = (request.GET.get('end_date') or '').strip()
    if not start:
        start = today.replace(day=1).strftime('%Y-%m-%d')
    if not end:
        end = today.strftime('%Y-%m-%d')
    return start, end


@require_http_methods(['GET'])
@_require_auth
def overview(request):
    """
    GET /api/report/overview
    Query: start_date, end_date（可选，用于入库出库统计）
    """
    start_date, end_date = _date_range(request)

    with connection.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) FROM t_product WHERE status = 1')
        product_count = cursor.fetchone()[0] or 0

        cursor.execute("""
            SELECT COUNT(*) FROM t_product_sku s
            INNER JOIN t_product p ON p.id = s.product_id
            WHERE p.status = 1 AND s.min_stock > 0 AND s.stock <= s.min_stock
        """)
        warning_count = cursor.fetchone()[0] or 0

        cursor.execute('SELECT COUNT(*) FROM t_inbound_order WHERE status = 1')
        pending_inbound_count = cursor.fetchone()[0] or 0

        cursor.execute('SELECT COUNT(*) FROM t_outbound_order WHERE status = 1')
        pending_outbound_count = cursor.fetchone()[0] or 0

        cursor.execute("""
            SELECT COALESCE(SUM(s.stock * p.purchase_price), 0)
            FROM t_product_sku s INNER JOIN t_product p ON p.id = s.product_id
            WHERE p.status = 1
        """)
        total_stock_value = float(cursor.fetchone()[0] or 0)

        cursor.execute("""
            SELECT COUNT(*), COALESCE(SUM(total_quantity), 0)
            FROM t_inbound_order WHERE status = 2
            AND DATE(create_time) >= %s AND DATE(create_time) <= %s
        """, [start_date, end_date])
        row = cursor.fetchone()
        inbound_count = row[0] or 0
        inbound_quantity = row[1] or 0

        cursor.execute("""
            SELECT COUNT(*), COALESCE(SUM(total_quantity), 0)
            FROM t_outbound_order WHERE status = 2
            AND DATE(create_time) >= %s AND DATE(create_time) <= %s
        """, [start_date, end_date])
        row = cursor.fetchone()
        outbound_count = row[0] or 0
        outbound_quantity = row[1] or 0

    return success({
        'product_count': product_count,
        'total_stock_value': f'{total_stock_value:.2f}',
        'inbound_count': inbound_count,
        'inbound_quantity': inbound_quantity,
        'outbound_count': outbound_count,
        'outbound_quantity': outbound_quantity,
        'warning_count': warning_count,
        'pending_inbound_count': pending_inbound_count,
        'pending_outbound_count': pending_outbound_count,
    })


@require_http_methods(['GET'])
@_require_auth
def report_inbound(request):
    """GET /api/report/inbound  按 product/category/day 分组"""
    start_date, end_date = _date_range(request)
    group_by = (request.GET.get('group_by') or 'product').strip().lower()
    if group_by not in ('product', 'category', 'day'):
        group_by = 'product'

    with connection.cursor() as cursor:
        if group_by == 'product':
            cursor.execute("""
                SELECT i.product_id, p.name as product_name,
                    SUM(i.quantity) as total_quantity, SUM(i.total_price) as total_amount
                FROM t_inbound_item i
                JOIN t_inbound_order o ON o.id = i.inbound_id
                LEFT JOIN t_product p ON p.id = i.product_id
                WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
                GROUP BY i.product_id, p.name
            """, [start_date, end_date])
            rows = cursor.fetchall()
            data = [{
                'product_id': r[0],
                'product_name': r[1] or '',
                'total_quantity': r[2] or 0,
                'total_amount': f'{float(r[3] or 0):.2f}',
            } for r in rows]
        elif group_by == 'category':
            cursor.execute("""
                SELECT p.category_id, c.name as category_name,
                    SUM(i.quantity) as total_quantity, SUM(i.total_price) as total_amount
                FROM t_inbound_item i
                JOIN t_inbound_order o ON o.id = i.inbound_id
                JOIN t_product p ON p.id = i.product_id
                LEFT JOIN t_category c ON c.id = p.category_id
                WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
                GROUP BY p.category_id, c.name
            """, [start_date, end_date])
            rows = cursor.fetchall()
            data = [{
                'category_id': r[0],
                'category_name': r[1] or '未分类',
                'total_quantity': r[2] or 0,
                'total_amount': f'{float(r[3] or 0):.2f}',
            } for r in rows]
        else:  # day
            cursor.execute("""
                SELECT DATE(o.create_time) as day,
                    SUM(i.quantity) as total_quantity, SUM(i.total_price) as total_amount
                FROM t_inbound_item i
                JOIN t_inbound_order o ON o.id = i.inbound_id
                WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
                GROUP BY DATE(o.create_time)
            """, [start_date, end_date])
            rows = cursor.fetchall()
            data = [{
                'date': str(r[0]) if r[0] else '',
                'total_quantity': r[1] or 0,
                'total_amount': f'{float(r[2] or 0):.2f}',
            } for r in rows]
    return success(data)


@require_http_methods(['GET'])
@_require_auth
def report_outbound(request):
    """GET /api/report/outbound"""
    start_date, end_date = _date_range(request)
    group_by = (request.GET.get('group_by') or 'product').strip().lower()
    if group_by not in ('product', 'category', 'day'):
        group_by = 'product'

    with connection.cursor() as cursor:
        if group_by == 'product':
            cursor.execute("""
                SELECT i.product_id, p.name as product_name,
                    SUM(i.quantity) as total_quantity, SUM(i.total_price) as total_amount
                FROM t_outbound_item i
                JOIN t_outbound_order o ON o.id = i.outbound_id
                LEFT JOIN t_product p ON p.id = i.product_id
                WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
                GROUP BY i.product_id, p.name
            """, [start_date, end_date])
            rows = cursor.fetchall()
            data = [{
                'product_id': r[0],
                'product_name': r[1] or '',
                'total_quantity': r[2] or 0,
                'total_amount': f'{float(r[3] or 0):.2f}',
            } for r in rows]
        elif group_by == 'category':
            cursor.execute("""
                SELECT p.category_id, c.name as category_name,
                    SUM(i.quantity) as total_quantity, SUM(i.total_price) as total_amount
                FROM t_outbound_item i
                JOIN t_outbound_order o ON o.id = i.outbound_id
                JOIN t_product p ON p.id = i.product_id
                LEFT JOIN t_category c ON c.id = p.category_id
                WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
                GROUP BY p.category_id, c.name
            """, [start_date, end_date])
            rows = cursor.fetchall()
            data = [{
                'category_id': r[0],
                'category_name': r[1] or '未分类',
                'total_quantity': r[2] or 0,
                'total_amount': f'{float(r[3] or 0):.2f}',
            } for r in rows]
        else:
            cursor.execute("""
                SELECT DATE(o.create_time) as day,
                    SUM(i.quantity) as total_quantity, SUM(i.total_price) as total_amount
                FROM t_outbound_item i
                JOIN t_outbound_order o ON o.id = i.outbound_id
                WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
                GROUP BY DATE(o.create_time)
            """, [start_date, end_date])
            rows = cursor.fetchall()
            data = [{
                'date': str(r[0]) if r[0] else '',
                'total_quantity': r[1] or 0,
                'total_amount': f'{float(r[2] or 0):.2f}',
            } for r in rows]
    return success(data)


@require_http_methods(['GET'])
@_require_auth
def report_turnover(request):
    """GET /api/report/turnover  周转率 = 出库量/平均库存"""
    start_date, end_date = _date_range(request)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT i.product_id, p.name as product_name,
                SUM(i.quantity) as outbound_quantity
            FROM t_outbound_item i
            JOIN t_outbound_order o ON o.id = i.outbound_id
            JOIN t_product p ON p.id = i.product_id
            WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
            GROUP BY i.product_id, p.name
        """, [start_date, end_date])
        out_rows = cursor.fetchall()

        cursor.execute("""
            SELECT i.product_id, SUM(i.quantity) as inbound_qty
            FROM t_inbound_item i
            JOIN t_inbound_order o ON o.id = i.inbound_id
            WHERE o.status = 2 AND DATE(o.create_time) >= %s AND DATE(o.create_time) <= %s
            GROUP BY i.product_id
        """, [start_date, end_date])
        in_map = {r[0]: r[1] for r in cursor.fetchall()}

    from django.db.models import Sum
    from ..models import ProductSku
    pid_list = [r[0] for r in out_rows]
    sku_totals = {
        r['product_id']: int(r['total'] or 0)
        for r in ProductSku.objects.filter(product_id__in=pid_list).values('product_id').annotate(total=Sum('stock'))
    }
    data = []
    for pid, pname, out_qty in out_rows:
        out_qty = int(out_qty or 0)
        inbound_qty = int(in_map.get(pid, 0) or 0)
        current = int(sku_totals.get(pid) or 0)
        start_stock = current - inbound_qty + out_qty
        avg_stock = (start_stock + current) / 2.0
        rate = round(out_qty / avg_stock, 2) if avg_stock > 0 else 0
        data.append({
            'product_id': pid,
            'product_name': pname or '',
            'avg_stock': round(avg_stock, 2),
            'outbound_quantity': out_qty,
            'turnover_rate': rate,
        })
    return success(data)
