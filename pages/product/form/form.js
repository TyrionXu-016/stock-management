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
    },
    skus: [{ id: 'new-0', size: '均码', stock: 0, min_stock: 0, max_stock: 0 }],
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
      }
      const skus = (p.skus || []).map((s) => ({
        id: s.id,
        size: s.size || '',
        stock: s.stock != null ? s.stock : 0,
        min_stock: s.min_stock != null ? s.min_stock : 0,
        max_stock: s.max_stock != null ? s.max_stock : 0,
      }))
      if (skus.length === 0) skus.push({ id: 'new-0', size: '均码', stock: 0, min_stock: 0, max_stock: 0 })
      const cats = this.data.categories
      const units = this.data.units
      const ci = (cats || []).findIndex((c) => c.id === form.category_id)
      const categoryIndex = ci >= 0 ? ci : 0
      const categoryName = ci >= 0 ? cats[ci].name : ''
      const unitIndex = (units || []).indexOf(form.unit) >= 0 ? (units || []).indexOf(form.unit) : 0
      this.setData({ form, skus, categoryIndex, categoryName, unitIndex })
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

  onSkuInput(e) {
    const { index, field } = e.currentTarget.dataset
    const value = e.detail.value
    const skus = this.data.skus.slice()
    const idx = parseInt(index, 10)
    if (skus[idx]) {
      if (field === 'stock' || field === 'min_stock' || field === 'max_stock') {
        const n = value === '' ? 0 : parseInt(value, 10)
        skus[idx][field] = isNaN(n) ? skus[idx][field] : n
      } else {
        skus[idx][field] = value
      }
      this.setData({ skus })
    }
  },

  onAddSku() {
    const skus = this.data.skus.slice()
    const isEdit = this.data.isEdit
    skus.push({
      id: isEdit ? null : 'new-' + Date.now(),
      size: '',
      stock: 0,
      min_stock: 0,
      max_stock: 0,
    })
    this.setData({ skus })
    if (isEdit) {
      wx.showToast({ title: '请先输入尺码并保存', icon: 'none' })
    }
  },

  async onSaveNewSku(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const skus = this.data.skus.slice()
    const item = skus[index]
    if (!item || (item.id && typeof item.id === 'number')) return
    const size = (item.size || '').trim() || '均码'
    try {
      await productApi.createSku(this.data.id, {
        size,
        stock: parseInt(item.stock, 10) || 0,
        min_stock: parseInt(item.min_stock, 10) || 0,
        max_stock: parseInt(item.max_stock, 10) || 0,
      })
      const detail = await productApi.getDetail(this.data.id)
      const newSkus = (detail.skus || []).map((s) => ({
        id: s.id,
        size: s.size || '',
        stock: s.stock != null ? s.stock : 0,
        min_stock: s.min_stock != null ? s.min_stock : 0,
        max_stock: s.max_stock != null ? s.max_stock : 0,
      }))
      this.setData({ skus: newSkus })
      wx.showToast({ title: '已添加尺码', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' })
    }
  },

  async onSaveSku(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const skus = this.data.skus
    const item = skus[index]
    if (!item || !item.id || typeof item.id !== 'number') return
    if (!item.size || !item.size.trim()) {
      wx.showToast({ title: '请输入尺码', icon: 'none' })
      return
    }
    try {
      await productApi.updateSku(this.data.id, item.id, {
        stock: item.stock,
        min_stock: item.min_stock,
        max_stock: item.max_stock,
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },

  async onDelSku(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const skus = this.data.skus.slice()
    const item = skus[index]
    if (!item) return
    if (this.data.isEdit && item.id && typeof item.id === 'number') {
      const ok = await new Promise((resolve) => {
        wx.showModal({ title: '确认删除该尺码？', success: (r) => resolve(r.confirm) })
      })
      if (!ok) return
      try {
        await productApi.deleteSku(this.data.id, item.id)
        skus.splice(index, 1)
        this.setData({ skus })
        wx.showToast({ title: '已删除', icon: 'success' })
      } catch (err) {
        wx.showToast({ title: err.message || '删除失败', icon: 'none' })
      }
    } else {
      skus.splice(index, 1)
      this.setData({ skus })
    }
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
    const numFields = ['purchase_price', 'sale_price']
    for (const f of numFields) {
      const v = form[f]
      if (v !== '' && v !== null && v !== undefined) {
        const n = parseFloat(v)
        if (isNaN(n) || n < 0) {
          wx.showToast({ title: `请输入有效的${f === 'purchase_price' ? '进价' : '售价'}`, icon: 'none' })
          return false
        }
      }
    }
    const { skus } = this.data
    if (!skus || skus.length === 0) {
      wx.showToast({ title: '请至少添加一个尺码', icon: 'none' })
      return false
    }
    if (!this.data.isEdit) {
      for (let i = 0; i < skus.length; i++) {
        if (!skus[i].size || !String(skus[i].size).trim()) {
          wx.showToast({ title: `第 ${i + 1} 个尺码不能为空`, icon: 'none' })
          return false
        }
      }
    }
    return true
  },

  async onSubmit() {
    if (!this._validate() || this.data.submitting) return

    const { form, id, isEdit, skus } = this.data
    const payload = {
      name: form.name.trim(),
      spec: (form.spec || '').trim(),
      category_id: form.category_id || undefined,
      brand: (form.brand || '').trim(),
      unit: form.unit || '件',
      cover_image: form.cover_image || undefined,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : undefined,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : undefined,
    }
    if (!isEdit) {
      payload.sku_code = form.sku_code.trim()
      payload.skus = skus.map((s) => ({
        size: (s.size || '').trim() || '均码',
        stock: parseInt(s.stock, 10) || 0,
        min_stock: parseInt(s.min_stock, 10) || 0,
        max_stock: parseInt(s.max_stock, 10) || 0,
      }))
    }

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
