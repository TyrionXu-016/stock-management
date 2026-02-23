// pages/outbound/form/form.js
const outboundApi = require('../../../api/outbound')
const productApi = require('../../../api/product')

Page({
  data: {
    receiver: '',
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

  onReceiverInput(e) {
    this.setData({ receiver: e.detail.value })
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
      wx.showToast({ title: '已添加该商品', icon: 'none' })
      return
    }
    try {
      const detail = await productApi.getDetail(product.id)
      const skus = detail.skus || []
      if (skus.length === 0) {
        wx.showToast({ title: '该商品未配置尺码', icon: 'none' })
        return
      }
      const first = skus[0]
      items.push({
        product_id: product.id,
        sku_id: first.id,
        product_name: product.name,
        sku_code: product.sku_code,
        size: first.size,
        stock: first.stock != null ? first.stock : 0,
        skus,
        _skuIndex: 0,
        quantity: 1,
        unit_price: product.sale_price || '0',
        _total: '0.00',
      })
      this._recalcItems(items)
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onSizePick(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10)
    const idx = parseInt(e.detail.value, 10)
    const items = [...this.data.items]
    const item = items[index]
    if (!item || !item.skus || !item.skus[idx]) return
    const sku = item.skus[idx]
    item.sku_id = sku.id
    item.size = sku.size
    item.stock = sku.stock != null ? sku.stock : 0
    item._skuIndex = idx
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

  _checkStock() {
    for (const i of this.data.items) {
      const qty = parseInt(i.quantity, 10) || 0
      const stock = i.stock != null ? i.stock : 0
      if (qty > stock) {
        return `商品「${i.product_name}」${i.size || ''}码 库存不足，当前 ${stock}，请求 ${qty}`
      }
    }
    return null
  },

  async onSubmit() {
    const { items, submitting } = this.data
    if (submitting) return
    if (!items.length) {
      wx.showToast({ title: '请至少添加一件商品', icon: 'none' })
      return
    }
    const stockErr = this._checkStock()
    if (stockErr) {
      wx.showToast({ title: stockErr, icon: 'none', duration: 3000 })
      return
    }

    this.setData({ submitting: true })
    try {
      const payload = {
        receiver: (this.data.receiver || '').trim(),
        remark: (this.data.remark || '').trim(),
        items: items.map((i) => ({
          product_id: i.product_id,
          sku_id: i.sku_id,
          quantity: parseInt(i.quantity, 10) || 0,
          unit_price: parseFloat(i.unit_price) || 0,
        })),
      }
      await outboundApi.create(payload)
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
