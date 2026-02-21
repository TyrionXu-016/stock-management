"""
JWT 工具
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings


def encode(user_id):
    """生成 JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS),
        'iat': datetime.utcnow(),
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm='HS256'
    )


def decode(token):
    """解析 JWT token，返回 user_id 或 None"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
