"""
统一 API 响应格式
"""
from django.http import JsonResponse


def success(data=None, message='success'):
    return JsonResponse({
        'code': 0,
        'message': message,
        'data': data if data is not None else {}
    })


def error(code=500, message='服务器错误', data=None):
    return JsonResponse({
        'code': code,
        'message': message,
        'data': data if data is not None else {}
    }, status=200)  # 业务错误仍返回 200，通过 code 区分


def paginated(list_data, total, page=1, page_size=20):
    """分页响应"""
    return {
        'list': list_data,
        'total': total,
        'page': page,
        'page_size': page_size,
    }
