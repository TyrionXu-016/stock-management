// pages/inventory/check-form/check-form.js
const inventoryApi = require('../../../api/inventory')

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

  _addProduct(product) {
    const items = [...this.data.items]
    if (items.some((i) => i.product_id === product.id)) {
      wx.showToast({ title: '已添加该商品', icon: 'none' })
      return
    }
    const bookStock = product.stock != null ? product.stock : 0
    items.push({
      product_id: product.id,
      product_name: product.name,
      book_stock: bookStock,
      actual_stock: bookStock,
      _diff: 0,
    })
    this._recalcItems(items)
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
