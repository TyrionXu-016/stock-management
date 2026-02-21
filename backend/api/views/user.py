"""
用户相关视图
"""
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from ..utils.response import success, error


def _profile_view(request):
    """
    统一处理 GET/PUT /api/user/profile
    """
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')

    if request.method == 'GET':
        return success(request.current_user.to_dict())

    if request.method == 'PUT':
        try:
            body = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            return error(422, '参数格式错误')

        user = request.current_user
        if 'nickname' in body and body['nickname'] is not None:
            user.nickname = str(body['nickname'])[:100]
        if 'avatar' in body and body['avatar'] is not None:
            user.avatar = str(body['avatar'])[:500]
        if 'phone' in body and body['phone'] is not None:
            user.phone = str(body['phone'])[:20]

        user.save(update_fields=['nickname', 'avatar', 'phone', 'update_time'])
        return success(user.to_dict())

    return error(405, 'Method Not Allowed')


@csrf_exempt
@require_http_methods(['GET', 'PUT'])
def profile(request):
    """GET/PUT /api/user/profile"""
    return _profile_view(request)
