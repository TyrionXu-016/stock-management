// pages/product/form/form.js
const productApi = require('../../../api/product')
const categoryApi = require('../../../api/category')
const { uploadImage } = require('../../../utils/upload')

Page({
  data: {
    id: null,
    isEdit: false,
    categories: [],
    units: ['件', '个', '箱', 'kg', '瓶', '盒'],
    categoryIndex: 0,
    categoryName: '',
    unitIndex: 0,
    form: {
      sku_code: '',
      name: '',
      spec: '',
      category_id: null,
      brand: '',
      unit: '件',
      cover_image: '',
      purchase_price: '',
      sale_price: '',
      min_stock: '',
      max_stock: '',
    },
    submitting: false,
  },

  onLoad(options) {
    const id = options.id ? parseInt(options.id, 10) : null
    const isEdit = !!id
    this.setData({
      id,
      isEdit,
      submitText: isEdit ? '保存' : '添加',
    })
    this._loadCategories()
    if (id) this._loadProduct(id)
  },

  async _loadCategories() {
    try {
      const list = await categoryApi.getList()
      this.setData({ categories: list || [] })
    } catch (e) {
      this.setData({ categories: [] })
    }
  },

  async _loadProduct(id) {
    try {
      const p = await productApi.getDetail(id)
      const form = {
        sku_code: p.sku_code || '',
        name: p.name || '',
        spec: p.spec || '',
        category_id: p.category_id,
        brand: p.brand || '',
        unit: p.unit || '件',
        cover_image: p.cover_image || '',
        purchase_price: p.purchase_price != null ? String(p.purchase_price) : '',
        sale_price: p.sale_price != null ? String(p.sale_price) : '',
        min_stock: p.min_stock != null ? String(p.min_stock) : '',
        max_stock: p.max_stock != null ? String(p.max_stock) : '',
      }
      const cats = this.data.categories
      const units = this.data.units
      const ci = (cats || []).findIndex((c) => c.id === form.category_id)
      const categoryIndex = ci >= 0 ? ci : 0
      const categoryName = ci >= 0 ? cats[ci].name : ''
      const unitIndex = (units || []).indexOf(form.unit) >= 0 ? (units || []).indexOf(form.unit) : 0
      this.setData({ form, categoryIndex, categoryName, unitIndex })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({ [`form.${field}`]: value })
  },

  onCategoryPick(e) {
    const idx = parseInt(e.detail.value, 10)
    const cats = this.data.categories
    const item = cats[idx]
    const name = item ? item.name : ''
    this.setData({ 'form.category_id': item ? item.id : null, categoryIndex: idx, categoryName: name })
  },

  onUnitPick(e) {
    const units = this.data.units
    const idx = parseInt(e.detail.value, 10)
    const unit = units[idx] || '件'
    this.setData({ 'form.unit': unit, unitIndex: idx })
  },

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths && res.tempFilePaths[0]
        if (!tempFilePath) return
        wx.showLoading({ title: '上传中...' })
        try {
          const url = await uploadImage(tempFilePath)
          this.setData({ 'form.cover_image': url })
          wx.showToast({ title: '上传成功', icon: 'success' })
        } catch (e) {
          wx.showToast({ title: e.message || '上传失败', icon: 'none' })
        }
      },
    })
  },

  onDelImage() {
    this.setData({ 'form.cover_image': '' })
  },

  _validate() {
    const { form, isEdit } = this.data
    if (!form.name || !form.name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' })
      return false
    }
    if (!isEdit && (!form.sku_code || !form.sku_code.trim())) {
      wx.showToast({ title: '请输入 SKU 编码', icon: 'none' })
      return false
    }
    const numFields = ['purchase_price', 'sale_price', 'min_stock', 'max_stock']
    for (const f of numFields) {
      const v = form[f]
      if (v !== '' && v !== null && v !== undefined) {
        const n = parseFloat(v)
        if (isNaN(n) || n < 0) {
          wx.showToast({ title: `请输入有效的${f === 'purchase_price' ? '进价' : f === 'sale_price' ? '售价' : f === 'min_stock' ? '最低库存' : '最高库存'}`, icon: 'none' })
          return false
        }
      }
    }
    return true
  },

  async onSubmit() {
    if (!this._validate() || this.data.submitting) return

    const { form, id, isEdit } = this.data
    const payload = {
      name: form.name.trim(),
      spec: (form.spec || '').trim(),
      category_id: form.category_id || undefined,
      brand: (form.brand || '').trim(),
      unit: form.unit || '件',
      cover_image: form.cover_image || undefined,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : undefined,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : undefined,
      min_stock: form.min_stock ? parseInt(form.min_stock, 10) : undefined,
      max_stock: form.max_stock ? parseInt(form.max_stock, 10) : undefined,
    }
    if (!isEdit) payload.sku_code = form.sku_code.trim()

    this.setData({ submitting: true })
    try {
      if (isEdit) {
        await productApi.update(id, payload)
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        await productApi.create(payload)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      this.setData({ submitting: false })
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  onCancel() {
    wx.navigateBack()
  },
})
