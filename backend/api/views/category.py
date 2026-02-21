"""
商品分类相关视图
"""
import json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from ..models import Category, Product
from ..utils.response import success, error
from ..decorators import require_admin


def _parse_parent_id(request):
    val = request.GET.get('parent_id')
    if val is None or val == '':
        return None  # 不传则返回树形结构
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def categories(request):
    """
    GET/POST /api/categories
    GET Query: parent_id (可选)
    POST body: name, parent_id, sort
    """
    if request.method == 'POST':
        return _create_category(request)

    parent_id = _parse_parent_id(request)
    if parent_id is not None:
        qs = Category.objects.filter(parent_id=parent_id).order_by('sort', 'id')
        data = [c.to_dict(include_children=False) for c in qs]
    else:
        # 树形：只返回顶级，带 children
        roots = Category.objects.filter(parent_id=0).order_by('sort', 'id')
        data = [c.to_dict(include_children=True) for c in roots]
    return success(data)


def _create_category(request):
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')
    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    name = (body.get('name') or '').strip()
    if not name:
        return error(422, '分类名称不能为空')

    parent_id = body.get('parent_id', 0)
    try:
        parent_id = int(parent_id) if parent_id is not None else 0
    except (ValueError, TypeError):
        parent_id = 0
    sort = body.get('sort', 0)
    try:
        sort = int(sort) if sort is not None else 0
    except (ValueError, TypeError):
        sort = 0

    obj = Category.objects.create(
        name=name[:50],
        parent_id=parent_id,
        sort=sort,
    )
    return success(obj.to_dict())


def _update_category(request, pk):
    try:
        obj = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return error(404, '分类不存在')

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return error(422, '参数格式错误')

    if 'name' in body and body['name'] is not None:
        name = str(body['name']).strip()
        if name:
            obj.name = name[:50]
    if 'sort' in body and body['sort'] is not None:
        try:
            obj.sort = int(body['sort'])
        except (ValueError, TypeError):
            pass

    obj.save()
    return success(obj.to_dict())


def _delete_category(request, pk):
    """DELETE /api/categories/:id"""
    try:
        obj = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return error(404, '分类不存在')

    # 检查是否有子分类
    if Category.objects.filter(parent_id=pk).exists():
        return error(422, '请先删除该分类下的子分类')

    # 检查是否有关联商品
    if Product.objects.filter(category_id=pk).exists():
        return error(422, '该分类下存在商品，无法删除')

    obj.delete()
    return success()


@csrf_exempt
@require_http_methods(['PUT', 'DELETE'])
def category_detail(request, pk):
    """PUT/DELETE /api/categories/:id"""
    if not getattr(request, 'current_user', None):
        return error(401, '未登录或 token 已失效')
    if request.method == 'PUT':
        return _update_category(request, pk)
    if request.method == 'DELETE':
        if request.current_user.role != 2:
            return error(403, '需要管理员权限')
        return _delete_category(request, pk)
    return error(405, 'Method Not Allowed')
