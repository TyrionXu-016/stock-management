"""
API 数据模型，对应现有数据库表结构（managed=False）
"""
import json
from django.db import models


def _https_url(url):
    """小程序要求 HTTPS，将 http 转为 https"""
    if url and url.startswith('http://'):
        return 'https://' + url[7:]
    return url


class Category(models.Model):
    """商品分类表 t_category"""
    name = models.CharField(max_length=50)
    parent_id = models.IntegerField(default=0, db_column='parent_id')
    sort = models.IntegerField(default=0)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 't_category'
        ordering = ['sort', 'id']

    def to_dict(self, include_children=False):
        d = {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'sort': self.sort,
            'children': [],
        }
        if include_children:
            children = Category.objects.filter(parent_id=self.id).order_by('sort', 'id')
            d['children'] = [c.to_dict(include_children=False) for c in children]
        return d


class Product(models.Model):
    """商品表 t_product（款/SPU，库存按尺码在 t_product_sku）"""
    sku_code = models.CharField(max_length=50, db_index=True)
    name = models.CharField(max_length=200)
    spec = models.CharField(max_length=100, null=True, blank=True)
    category_id = models.IntegerField(null=True, blank=True, db_column='category_id')
    brand = models.CharField(max_length=100, null=True, blank=True)
    unit = models.CharField(max_length=20, default='件')
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)  # 兼容旧数据；有尺码时以 t_product_sku 汇总为准
    min_stock = models.IntegerField(default=0)
    max_stock = models.IntegerField(default=0)
    cover_image = models.CharField(max_length=500, null=True, blank=True, db_column='cover_image')
    status = models.SmallIntegerField(default=1)  # 1:正常 2:下架
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 't_product'

    def to_dict(self, category_name=None, include_skus=False):
        if category_name is None and self.category_id:
            try:
                cat = Category.objects.get(pk=self.category_id)
                category_name = cat.name
            except Category.DoesNotExist:
                category_name = None
        skus = list(ProductSku.objects.filter(product_id=self.id).order_by('size'))
        total_stock = sum(s.stock for s in skus) if skus else self.stock
        total_min = sum(s.min_stock for s in skus) if skus else self.min_stock
        total_max = sum(s.max_stock for s in skus) if skus else self.max_stock
        d = {
            'id': self.id,
            'sku_code': self.sku_code,
            'name': self.name,
            'spec': self.spec,
            'category_id': self.category_id,
            'category_name': category_name,
            'brand': self.brand,
            'unit': self.unit,
            'purchase_price': f'{float(self.purchase_price or 0):.2f}',
            'sale_price': f'{float(self.sale_price or 0):.2f}',
            'stock': total_stock,
            'min_stock': total_min,
            'max_stock': total_max,
            'cover_image': _https_url(self.cover_image) if self.cover_image else None,
            'status': self.status,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None,
        }
        if include_skus:
            d['skus'] = [s.to_dict() for s in skus]
        return d


class ProductSku(models.Model):
    """商品尺码表 t_product_sku（鞋码维度库存）"""
    product_id = models.BigIntegerField(db_column='product_id')
    size = models.CharField(max_length=20)  # 鞋码：38,39,40 或 均码
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=0)
    max_stock = models.IntegerField(default=0)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 't_product_sku'
        unique_together = (('product_id', 'size'),)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'size': self.size,
            'stock': self.stock,
            'min_stock': self.min_stock,
            'max_stock': self.max_stock,
        }


class InboundOrder(models.Model):
    """入库单表 t_inbound_order"""
    order_no = models.CharField(max_length=50, unique=True, db_index=True)
    supplier = models.CharField(max_length=100, null=True, blank=True)
    operator_id = models.BigIntegerField(null=True, blank=True, db_column='operator_id')
    total_quantity = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.SmallIntegerField(default=1)  # 1:待审批 2:已确认 3:已拒绝
    remark = models.TextField(null=True, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 't_inbound_order'


class InboundItem(models.Model):
    """入库单明细表 t_inbound_item"""
    inbound_id = models.BigIntegerField(db_column='inbound_id')
    product_id = models.BigIntegerField(db_column='product_id')
    sku_id = models.BigIntegerField(null=True, blank=True, db_column='sku_id')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    batch_no = models.CharField(max_length=50, null=True, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 't_inbound_item'


class OutboundOrder(models.Model):
    """出库单表 t_outbound_order"""
    order_no = models.CharField(max_length=50, unique=True, db_index=True)
    receiver = models.CharField(max_length=100, null=True, blank=True)
    operator_id = models.BigIntegerField(null=True, blank=True, db_column='operator_id')
    total_quantity = models.IntegerField(default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.SmallIntegerField(default=1)
    remark = models.TextField(null=True, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 't_outbound_order'


class OutboundItem(models.Model):
    """出库单明细表 t_outbound_item"""
    outbound_id = models.BigIntegerField(db_column='outbound_id')
    product_id = models.BigIntegerField(db_column='product_id')
    sku_id = models.BigIntegerField(null=True, blank=True, db_column='sku_id')
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 't_outbound_item'


class InventoryCheck(models.Model):
    """盘点单表 t_inventory_check"""
    check_no = models.CharField(max_length=50, unique=True, db_index=True)
    operator_id = models.BigIntegerField(null=True, blank=True, db_column='operator_id')
    status = models.SmallIntegerField(default=1)  # 1:进行中 2:已完成
    remark = models.TextField(null=True, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 't_inventory_check'


class InventoryCheckItem(models.Model):
    """盘点明细表 t_inventory_check_item"""
    check_id = models.BigIntegerField(db_column='check_id')
    product_id = models.BigIntegerField(db_column='product_id')
    sku_id = models.BigIntegerField(null=True, blank=True, db_column='sku_id')
    book_stock = models.IntegerField(default=0)
    actual_stock = models.IntegerField(default=0)
    diff_quantity = models.IntegerField(default=0)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 't_inventory_check_item'


class StockLog(models.Model):
    """库存变动记录表 t_stock_log"""
    product_id = models.BigIntegerField(db_column='product_id')
    sku_id = models.BigIntegerField(null=True, blank=True, db_column='sku_id')
    change_type = models.SmallIntegerField()  # 1:入库 2:出库 3:盘点
    change_quantity = models.IntegerField()
    before_stock = models.IntegerField(default=0)
    after_stock = models.IntegerField(default=0)
    related_id = models.BigIntegerField(null=True, blank=True, db_column='related_id')
    operator_id = models.BigIntegerField(null=True, blank=True, db_column='operator_id')
    remark = models.CharField(max_length=500, null=True, blank=True)
    create_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 't_stock_log'


class User(models.Model):
    """用户表 t_user"""
    openid = models.CharField(max_length=64, unique=True, db_index=True)
    unionid = models.CharField(max_length=64, null=True, blank=True)
    nickname = models.CharField(max_length=100, null=True, blank=True)
    avatar = models.CharField(max_length=500, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.SmallIntegerField(default=1)  # 1:普通用户 2:管理员
    status = models.SmallIntegerField(default=1)  # 1:正常 2:禁用
    create_time = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 't_user'

    def to_dict(self):
        return {
            'id': self.id,
            'openid': self.openid,
            'nickname': self.nickname,
            'avatar': self.avatar,
            'phone': self.phone,
            'role': self.role,
            'status': self.status,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
        }
