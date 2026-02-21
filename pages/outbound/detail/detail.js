// pages/outbound/detail/detail.js
const outboundApi = require('../../../api/outbound')
const store = require('../../../store/index')

const STATUS_MAP = { 1: '待审批', 2: '已确认', 3: '已拒绝' }

Page({
  data: {
    id: null,
    order: null,
    isAdmin: false,
    statusText: '',
  },

  onLoad(options) {
    const id = options.id ? parseInt(options.id, 10) : null
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    const user = store.getUser()
    this.setData({ id, isAdmin: user && user.role === 2 })
    this._loadDetail()
  },

  async _loadDetail() {
    try {
      const order = await outboundApi.getDetail(this.data.id)
      const statusText = STATUS_MAP[order.status] || '未知'
      const showApproveActions = order.status === 1 && (store.getUser() || {}).role === 2
      this.setData({ order, statusText, showApproveActions })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  async onApprove() {
    try {
      await outboundApi.updateStatus(this.data.id, 2)
      wx.showToast({ title: '已通过', icon: 'success' })
      this._loadDetail()
    } catch (e) {
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  async onReject() {
    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝该出库单吗？',
      confirmColor: '#dc2626',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await outboundApi.updateStatus(this.data.id, 3)
          wx.showToast({ title: '已拒绝', icon: 'success' })
          this._loadDetail()
        } catch (e) {
          wx.showToast({ title: e.message || '操作失败', icon: 'none' })
        }
      },
    })
  },
})
