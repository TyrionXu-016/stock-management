"""
图片上传相关视图
"""
import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from ..utils.response import success, error

ALLOWED_EXT = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_SIZE = 2 * 1024 * 1024  # 2MB


@csrf_exempt
@require_http_methods(['POST'])
def upload_image(request):
    """
    POST /api/upload/image
    接收 multipart/form-data，字段名 file 或 image
    返回 { "url": "..." }
    """
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')

    file_obj = request.FILES.get('file') or request.FILES.get('image')
    if not file_obj:
        return error(422, '请选择图片')

    ext = os.path.splitext(file_obj.name or '')[1].lower()
    if ext not in ALLOWED_EXT:
        return error(422, '仅支持 jpg/png/gif/webp 格式')

    if file_obj.size > MAX_SIZE:
        return error(422, '图片大小不能超过 2MB')

    rel_path = f'products/{uuid.uuid4().hex}{ext}'
    path = default_storage.save(rel_path, file_obj)
    base = getattr(settings, 'MEDIA_BASE_URL', None) or request.build_absolute_uri('/').rstrip('/')
    url = f'{base}{settings.MEDIA_URL}{path}'
    return success({'url': url})
