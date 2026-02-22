"""
API 路由
"""
from django.urls import path

from .views import auth, upload
from .views.user import profile
from .views import report
from .views import category, product
from .views import inbound, outbound
from .views import inventory

urlpatterns = [
    # 认证
    path('auth/login', auth.login),

    # 用户
    path('user/profile', profile),

    # 报表
    path('report/overview', report.overview),
    path('report/inbound', report.report_inbound),
    path('report/outbound', report.report_outbound),
    path('report/turnover', report.report_turnover),

    # 分类
    path('categories', category.categories),
    path('categories/<int:pk>', category.category_detail),

    # 上传
    path('upload/image', upload.upload_image),

    # 商品
    path('products', product.products),
    path('products/<int:pk>', product.product_detail),

    # 入库
    path('inbound', inbound.inbound_list_or_create),
    path('inbound/<int:pk>', inbound.get_inbound),
    path('inbound/<int:pk>/status', inbound.update_inbound_status),

    # 出库
    path('outbound', outbound.outbound_list_or_create),
    path('outbound/<int:pk>', outbound.get_outbound),
    path('outbound/<int:pk>/status', outbound.update_outbound_status),

    # 库存
    path('inventory', inventory.list_inventory),
    path('inventory/warning', inventory.list_warning),
    path('inventory/logs', inventory.list_logs),
    path('inventory/check', inventory.create_check),
    path('inventory/checks', inventory.list_checks),
    path('inventory/checks/<int:pk>', inventory.get_check),
]
