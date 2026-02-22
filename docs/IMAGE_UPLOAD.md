# 库存管理 - 图片上传功能实现文档

> 本文档描述在库存管理系统中为商品添加图片上传功能时，前端、后端及数据表需要完成的修改操作。

---

## 一、概述

图片上传功能主要应用于**商品管理**模块，用于：
- 商品主图（封面）：在商品列表、详情中展示
- 可选：商品多图（轮播图）

本文档采用「**先上传获取 URL，再提交商品表单**」的方案：
1. 小程序选择图片后调用上传接口，后端保存文件并返回访问 URL
2. 创建/编辑商品时，将图片 URL 传入商品接口

---

## 二、数据表变更

### 2.1 商品表 `t_product` 新增字段

在 `t_product` 表中新增图片相关字段：

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| cover_image | VARCHAR(500) | 封面图 URL | 主图，用于列表/详情展示 |
| images | TEXT | 多图 JSON 数组 | 可选，存储多张图片 URL，如 `["url1","url2"]` |

**SQL 示例：**

```sql
-- 添加封面图字段（必做）
ALTER TABLE t_product ADD COLUMN cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL' AFTER max_stock;

-- 可选：多图字段
ALTER TABLE t_product ADD COLUMN images TEXT DEFAULT NULL COMMENT '多图JSON数组' AFTER cover_image;
```

### 2.2 迁移脚本

若使用 migrations，可创建 `database/migrations/add_product_image.sql`：

```sql
USE stock_manager;

ALTER TABLE t_product ADD COLUMN cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL' AFTER max_stock;
-- ALTER TABLE t_product ADD COLUMN images TEXT DEFAULT NULL COMMENT '多图JSON数组' AFTER cover_image;
```

---

## 三、后端变更（Django）

### 3.1 配置文件 `backend/stock_manager/settings.py`

新增媒体文件配置：

```python
# 媒体文件（用户上传）
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 若使用对象存储（如阿里云 OSS），则上传后返回 CDN URL，可不使用 MEDIA_ROOT
```

主路由 `backend/stock_manager/urls.py` 需配置静态服务（开发环境）：

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... 原有路由
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 3.2 数据模型 `backend/api/models.py`

- 在 `Product` 模型中新增 `cover_image`、`images` 字段
- 在 `to_dict()` 中返回 `cover_image` 和 `images`

```python
# Product 模型新增
cover_image = models.CharField(max_length=500, null=True, blank=True, db_column='cover_image')
images = models.TextField(null=True, blank=True)  # JSON 数组字符串，如 '["url1","url2"]'

# to_dict() 中新增
'cover_image': self.cover_image,
'images': json.loads(self.images) if self.images else [],  # 需 import json
```

### 3.3 图片上传接口

**新建** `backend/api/views/upload.py`：

- 接口：`POST /api/upload/image`
- 接收：`multipart/form-data`，字段名 `file` 或 `image`
- 校验：文件类型（jpg/png/gif/webp）、大小（如 ≤ 2MB）
- 存储：保存到 `media/products/` 或对象存储
- 返回：`{ "url": "https://xxx/media/products/xxx.jpg" }`

**实现要点：**

```python
# 伪代码示例
import os
import uuid
from django.core.files.storage import default_storage

ALLOWED_EXT = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_SIZE = 2 * 1024 * 1024  # 2MB

def upload_image(request):
    if request.method != 'POST':
        return error(405, 'Method Not Allowed')
    file = request.FILES.get('file') or request.FILES.get('image')
    if not file:
        return error(422, '请选择图片')
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXT:
        return error(422, '仅支持 jpg/png/gif/webp')
    if file.size > MAX_SIZE:
        return error(422, '图片大小不能超过 2MB')
    # 保存文件，生成唯一文件名
    rel_path = f"products/{uuid.uuid4().hex}{ext}"
    path = default_storage.save(rel_path, file)
    url = request.build_absolute_uri(settings.MEDIA_URL + path)
    return success({'url': url})
```

路由 `backend/api/urls.py` 中注册：

```python
path('upload/image', upload.upload_image),
```

### 3.4 商品接口适配

在 `backend/api/views/product.py` 中：

- `_product_from_body`：增加对 `cover_image`、`images` 的解析
- 创建/更新商品时写入这两个字段

```python
# 在 _product_from_body 中新增
if is_create or 'cover_image' in body:
    data['cover_image'] = (body.get('cover_image') or '')[:500] or None
if is_create or 'images' in body:
    imgs = body.get('images')
    if isinstance(imgs, list):
        data['images'] = json.dumps([str(u)[:500] for u in imgs[:9]]) if imgs else None
    else:
        data['images'] = None
```

---

## 四、前端变更（微信小程序）

### 4.1 图片上传工具 `utils/upload.js`

封装 `wx.uploadFile`，用于上传图片并返回 URL：

```javascript
/**
 * 上传图片
 * @param {string} filePath - wx.chooseImage 返回的临时路径
 * @returns {Promise<string>} 图片访问 URL
 */
function uploadImage(filePath) {
  const config = require('./config')
  const auth = require('./auth')
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: config.baseUrl + '/api/upload/image',
      filePath,
      name: 'file',
      header: {
        Authorization: 'Bearer ' + (auth.getToken() || ''),
      },
      success(res) {
        const data = JSON.parse(res.data || '{}')
        if (data.code === 0 && data.data?.url) {
          resolve(data.data.url)
        } else {
          reject({ message: data.message || '上传失败' })
        }
      },
      fail(err) {
        reject({ message: err.errMsg || '上传失败' })
      },
    })
  })
}

module.exports = { uploadImage }
```

### 4.2 商品 API `api/product.js`

- 创建/更新接口已支持 JSON body，只需在 `data` 中增加 `cover_image`、`images` 字段
- 无需改动 `request.js`，普通请求保持 `Content-Type: application/json`

### 4.3 商品表单页 `pages/product/form/form`

**WXML 新增：**

```xml
<view class="group">
  <view class="label">商品图片</view>
  <view class="image-upload">
    <view class="image-preview" wx:if="{{form.cover_image}}">
      <image src="{{form.cover_image}}" mode="aspectFill" />
      <view class="del-btn" bindtap="onDelImage">×</view>
    </view>
    <view class="upload-btn" wx:else bindtap="onChooseImage">
      <text>+ 上传图片</text>
    </view>
  </view>
</view>
```

**JS 逻辑：**

- `data.form` 增加 `cover_image: ''`
- `onChooseImage`：调用 `wx.chooseImage`，选图后调用 `uploadImage`，成功后 `setData form.cover_image = url`
- `onDelImage`：清空 `form.cover_image`
- `onSubmit`：在 `payload` 中增加 `cover_image: form.cover_image || undefined`
- `_loadProduct`：从详情中读取 `cover_image` 填入表单

### 4.4 商品详情页 `pages/product/detail/detail`

**WXML 新增：**

```xml
<view class="card cover-card" wx:if="{{product.cover_image}}">
  <image src="{{product.cover_image}}" mode="aspectFit" class="cover-img" />
</view>
```

在基础信息卡片上方或合适位置展示主图。

### 4.5 商品卡片组件 `components/product-card/product-card`

**WXML 修改：**

```xml
<view class="product-card {{cardClass}}" bindtap="onTap">
  <view class="main">
    <image wx:if="{{product.cover_image}}" src="{{product.cover_image}}" class="thumb" mode="aspectFill" />
    <view class="thumb-placeholder" wx:else>无图</view>
    <view class="info">
      <view class="name">{{product.name || '-'}}</view>
      <view class="meta">...</view>
    </view>
  </view>
  ...
</view>
```

需调整布局：左侧缩略图 + 右侧信息。

### 4.6 请求域名配置

在微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名 中，将 **uploadFile 合法域名** 配置为后端 API 域名，例如：

```
https://your-api-domain.com
```

---

## 五、可选扩展：多图上传

若启用 `images` 多图字段：

1. **后端**：`Product.to_dict()` 返回 `images` 数组；创建/更新时解析 `images` 数组并存入 DB
2. **前端**：表单中支持多张图片（列表展示 + 上传 + 删除），`payload.images = ['url1','url2']`
3. **详情页**：使用 `swiper` 轮播展示多图

---

## 六、实施检查清单

| 步骤 | 操作 | 文件/位置 |
|------|------|-----------|
| 1 | 执行 ALTER TABLE 添加 `cover_image` | 数据库 |
| 2 | 配置 MEDIA_URL、MEDIA_ROOT | settings.py |
| 3 | 配置 MEDIA 静态服务 | urls.py |
| 4 | 模型新增 cover_image、images | api/models.py |
| 5 | 新建上传接口 | api/views/upload.py |
| 6 | 注册上传路由 | api/urls.py |
| 7 | 商品接口支持 cover_image、images | api/views/product.py |
| 8 | 新建 uploadImage 工具 | utils/upload.js |
| 9 | 表单页增加图片选择与上传 | pages/product/form/ |
| 10 | 详情页展示主图 | pages/product/detail/ |
| 11 | 列表卡片展示缩略图 | components/product-card/ |
| 12 | 配置 uploadFile 合法域名 | 微信公众平台 |

---

## 七、安全与限制建议

- 限制文件类型：仅允许 jpg、png、gif、webp
- 限制文件大小：建议 ≤ 2MB
- 生产环境建议使用对象存储（阿里云 OSS、腾讯云 COS 等），避免占用应用服务器磁盘
- 上传接口需校验登录态（JWT），防止未授权上传
