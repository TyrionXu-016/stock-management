// pages/product/detail/detail.js
const productApi = require('../../../api/product')
const store = require('../../../store/index')

Page({
  data: {
    id: null,
    product: null,
    isAdmin: false,
  },

  onLoad(options) {
    const id = options.id ? parseInt(options.id, 10) : null
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    const user = store.getUser()
    this.setData({
      id,
      isAdmin: user && user.role === 2,
    })
    this._loadDetail()
  },

  async _loadDetail() {
    try {
      const product = await productApi.getDetail(this.data.id)
      const stock = product.stock != null ? product.stock : 0
      const skus = product.skus || []
      const showWarn = skus.some((s) => s.min_stock > 0 && s.stock <= s.min_stock)
      this.setData({
        product,
        statusText: product.status === 2 ? '已下架' : '正常',
        statusClass: product.status === 2 ? 'offline' : '',
        stockText: String(stock),
        stockClass: showWarn ? 'warn' : '',
        showWarnTip: showWarn,
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/product/form/form?id=${this.data.id}` })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除该商品吗？',
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) this._doDelete()
      },
    })
  },

  async _doDelete() {
    try {
      await productApi.remove(this.data.id)
      wx.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      wx.showToast({ title: e.message || '删除失败', icon: 'none' })
    }
  },

  onLogs() {
    wx.navigateTo({ url: `/pages/inventory/logs/logs?product_id=${this.data.id}` })
  },
})
