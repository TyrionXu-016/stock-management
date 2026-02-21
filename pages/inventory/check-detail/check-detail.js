// pages/inventory/check-detail/check-detail.js
const inventoryApi = require('../../../api/inventory')

const STATUS_MAP = { 1: '进行中', 2: '已完成' }

Page({
  data: {
    id: null,
    check: null,
    statusText: '',
  },

  onLoad(options) {
    const id = options.id ? parseInt(options.id, 10) : null
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ id })
    this._loadDetail()
  },

  async _loadDetail() {
    try {
      const check = await inventoryApi.getCheckDetail(this.data.id)
      const statusText = STATUS_MAP[check.status] || '未知'
      const items = (check.items || []).map((i) => ({
        ...i,
        _diffClass: (i.diff_quantity || 0) > 0 ? 'gain' : (i.diff_quantity || 0) < 0 ? 'loss' : '',
      }))
      this.setData({ check: { ...check, items }, statusText })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },
})
