"""
API 中间件
"""
from .utils.jwt_util import decode
from .models import User


def get_request_user(request):
    """
    从 Authorization: Bearer <token> 解析出当前用户，附加到 request.current_user
    未登录或 token 无效时 request.current_user 为 None
    """
    request.current_user = None
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if not auth_header or not auth_header.startswith('Bearer '):
        return
    token = auth_header[7:].strip()
    if not token:
        return
    user_id = decode(token)
    if not user_id:
        return
    try:
        request.current_user = User.objects.get(pk=user_id, status=1)
    except User.DoesNotExist:
        pass


class JsonResponseMiddleware:
    """
    确保 API 视图异常时返回 JSON 格式（可选，部分异常已在视图中处理）
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 解析 JWT，附加 current_user
        if request.path.startswith('/api/'):
            get_request_user(request)
        return self.get_response(request)
