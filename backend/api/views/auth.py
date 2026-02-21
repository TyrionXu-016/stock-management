"""
认证相关视图
"""
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from ..models import User
from ..utils.response import success, error
from ..utils.jwt_util import encode
from ..utils.wechat import code2session


@csrf_exempt
@require_http_methods(['POST'])
def login(request):
    """
    POST /api/auth/login
    请求体: { "code": "微信登录返回的 code" }
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        return error(422, '参数格式错误')

    code = body.get('code')
    if not code or not isinstance(code, str):
        return error(422, '缺少 code 参数')

    openid, session_key, unionid, errmsg = code2session(code.strip())
    if not openid:
        return error(401, errmsg or '微信登录失败，请重试')

    # 可选：前端传入的昵称、头像（来自 wx.getUserProfile 或 头像昵称填写能力）
    nickname = (body.get('nickname') or body.get('nickName') or '').strip()
    avatar = (body.get('avatar') or body.get('avatarUrl') or '').strip()

    # 查找或创建用户
    user, created = User.objects.get_or_create(
        openid=openid,
        defaults={
            'unionid': unionid,
            'nickname': nickname[:100] if nickname else '微信用户',
            'avatar': avatar[:500] if avatar else None,
            'role': 1,
            'status': 1,
        }
    )
    if not created:
        if user.status != 1:
            return error(403, '账号已被禁用')
        # 若传入了昵称或头像且与当前不同，则更新
        updated = False
        if nickname and user.nickname != nickname:
            user.nickname = nickname[:100]
            updated = True
        if avatar and user.avatar != avatar:
            user.avatar = avatar[:500]
            updated = True
        if updated:
            user.save(update_fields=['nickname', 'avatar', 'update_time'])

    token = encode(user.id)
    user_data = {
        'id': user.id,
        'nickname': user.nickname,
        'avatar': user.avatar,
        'role': user.role,
    }
    return success({
        'token': token,
        'user': user_data,
    })
