// pages/inventory/warning/warning.js
const inventoryApi = require('../../../api/inventory')

Page({
  data: {
    list: [],
    loading: false,
  },

  onLoad() {
    this._loadList()
  },

  onPullDownRefresh() {
    this._loadList().finally(() => wx.stopPullDownRefresh())
  },

  async _loadList() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const list = await inventoryApi.getWarning()
      const items = (list || []).map((i) => ({
        ...i,
        _gap: Math.max(0, (i.min_stock || 0) - (i.stock != null ? i.stock : 0)),
      }))
      this.setData({ list: items, loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    if (item && item.product_id) {
      wx.navigateTo({ url: `/pages/product/detail/detail?id=${item.product_id}` })
    }
  },

  onReplenish(e) {
    const item = e.currentTarget.dataset.item
    if (item && item.product_id) {
      getApp().globalData.pendingProductSelect = {
        id: item.product_id,
        sku_id: item.sku_id,
        name: item.product_name,
        sku_code: item.sku_code,
        stock: item.stock,
        purchase_price: '0',
      }
      wx.navigateTo({ url: '/pages/inbound/form/form' })
    }
  },
})
