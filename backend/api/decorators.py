"""
API 装饰器
"""
from functools import wraps

from .utils.response import error


def require_auth(view_func):
    """要求登录"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not getattr(request, 'current_user', None):
            return error(401, '未登录或 token 已失效')
        return view_func(request, *args, **kwargs)
    return wrapper


def require_admin(view_func):
    """要求管理员 (role=2)"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not getattr(request, 'current_user', None):
            return error(401, '未登录或 token 已失效')
        if request.current_user.role != 2:
            return error(403, '需要管理员权限')
        return view_func(request, *args, **kwargs)
    return wrapper
