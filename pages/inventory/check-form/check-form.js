// pages/inventory/check-form/check-form.js
const inventoryApi = require('../../../api/inventory')
const productApi = require('../../../api/product')

Page({
  data: {
    remark: '',
    items: [],
    submitting: false,
  },

  onShow() {
    const pending = getApp().globalData.pendingProductSelect
    if (pending) {
      getApp().globalData.pendingProductSelect = null
      this._addProduct(pending)
    }
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  onAddProduct() {
    wx.navigateTo({ url: '/pages/product/select/select' })
  },

  async _addProduct(product) {
    const items = [...this.data.items]
    if (items.some((i) => i.product_id === product.id)) {
      wx.showToast({ title: '已添加该商品，请删除后重加', icon: 'none' })
      return
    }
    try {
      const detail = await productApi.getDetail(product.id)
      const skus = detail.skus || []
      if (skus.length === 0) {
        wx.showToast({ title: '该商品未配置尺码', icon: 'none' })
        return
      }
      skus.forEach((sku) => {
        const book = sku.stock != null ? sku.stock : 0
        items.push({
          product_id: product.id,
          sku_id: sku.id,
          product_name: product.name,
          size: sku.size,
          book_stock: book,
          actual_stock: book,
          _diff: 0,
        })
      })
      this._recalcItems(items)
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onActualInput(e) {
    const index = e.currentTarget.dataset.index
    const value = parseInt(e.detail.value, 10)
    const items = [...this.data.items]
    const item = items[index]
    if (!item) return
    item.actual_stock = isNaN(value) ? item.book_stock : value
    this._recalcItems(items)
  },

  onRemoveItem(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items.filter((_, i) => i !== index)
    this._recalcItems(items)
  },

  _recalcItems(items) {
    items.forEach((i) => {
      const actual = parseInt(i.actual_stock, 10) || 0
      const book = parseInt(i.book_stock, 10) || 0
      const d = actual - book
      i._diff = d
      i._diffClass = d > 0 ? 'gain' : d < 0 ? 'loss' : ''
    })
    this.setData({ items })
  },

  async onSubmit() {
    const { items, submitting } = this.data
    if (submitting) return
    if (!items.length) {
      wx.showToast({ title: '请至少添加一件商品', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const payload = {
        remark: (this.data.remark || '').trim(),
        items: items.map((i) => ({
          product_id: i.product_id,
          sku_id: i.sku_id,
          book_stock: parseInt(i.book_stock, 10) || 0,
          actual_stock: parseInt(i.actual_stock, 10) || 0,
        })),
      }
      await inventoryApi.createCheck(payload)
      wx.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      this.setData({ submitting: false })
      wx.showToast({ title: e.message || '提交失败', icon: 'none' })
    }
  },

  onCancel() {
    wx.navigateBack()
  },
})
