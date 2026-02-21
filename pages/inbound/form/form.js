// pages/inbound/form/form.js
const inboundApi = require('../../../api/inbound')
const productApi = require('../../../api/product')

Page({
  data: {
    supplier: '',
    remark: '',
    items: [],
    totalQuantity: 0,
    totalAmount: '0.00',
    submitting: false,
  },

  onShow() {
    const pending = getApp().globalData.pendingProductSelect
    if (pending) {
      getApp().globalData.pendingProductSelect = null
      this._addProduct(pending)
    }
  },

  onSupplierInput(e) {
    this.setData({ supplier: e.detail.value })
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
    items.push({
      product_id: product.id,
      product_name: product.name,
      sku_code: product.sku_code,
      quantity: 1,
      unit_price: product.purchase_price || '0',
      batch_no: '',
      _total: '0.00',
    })
    this._recalcItems(items)
  },

  onItemInput(e) {
    const { field, index } = e.currentTarget.dataset
    const value = e.detail.value
    const items = [...this.data.items]
    const item = items[index]
    if (!item) return
    if (field === 'quantity') item.quantity = parseInt(value, 10) || 0
    else if (field === 'unit_price') item.unit_price = value
    else if (field === 'batch_no') item.batch_no = value
    this._recalcItems(items)
  },

  onRemoveItem(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items.filter((_, i) => i !== index)
    this._recalcItems(items)
  },

  _recalcItems(items) {
    let totalQty = 0
    let totalAmt = 0
    items.forEach((i) => {
      const qty = parseInt(i.quantity, 10) || 0
      const price = parseFloat(i.unit_price) || 0
      const total = (qty * price).toFixed(2)
      i._total = total
      totalQty += qty
      totalAmt += qty * price
    })
    this.setData({
      items,
      totalQuantity: totalQty,
      totalAmount: totalAmt.toFixed(2),
    })
  },

  async onSubmit() {
    const { supplier, items, submitting } = this.data
    if (submitting) return
    if (!items.length) {
      wx.showToast({ title: '请至少添加一件商品', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const payload = {
        supplier: (supplier || '').trim(),
        remark: (this.data.remark || '').trim(),
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: parseInt(i.quantity, 10) || 0,
          unit_price: parseFloat(i.unit_price) || 0,
          batch_no: (i.batch_no || '').trim() || undefined,
        })),
      }
      await inboundApi.create(payload)
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
