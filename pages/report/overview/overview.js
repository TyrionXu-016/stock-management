// pages/report/overview/overview.js
const reportApi = require('../../../api/report')

Page({
  data: {
    startDate: '',
    endDate: '',
    stats: {
      product_count: 0,
      total_stock_value: '0.00',
      inbound_count: 0,
      inbound_quantity: 0,
      outbound_count: 0,
      outbound_quantity: 0,
      warning_count: 0,
      pending_inbound_count: 0,
      pending_outbound_count: 0,
    },
    loading: false,
  },

  onLoad() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const startStr = this._formatDate(start)
    const endStr = this._formatDate(now)
    this.setData({ startDate: startStr, endDate: endStr })
    this._loadOverview()
  },

  onPullDownRefresh() {
    this._loadOverview().finally(() => wx.stopPullDownRefresh())
  },

  onDateStartChange(e) {
    this.setData({ startDate: e.detail.value })
    this._loadOverview()
  },

  onDateEndChange(e) {
    this.setData({ endDate: e.detail.value })
    this._loadOverview()
  },

  onInbound() {
    wx.navigateTo({ url: '/pages/report/statistics/statistics?type=inbound' })
  },

  onOutbound() {
    wx.navigateTo({ url: '/pages/report/statistics/statistics?type=outbound' })
  },

  onTurnover() {
    wx.navigateTo({ url: '/pages/report/statistics/statistics?type=turnover' })
  },

  _formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  async _loadOverview() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const params = {}
      if (this.data.startDate) params.start_date = this.data.startDate
      if (this.data.endDate) params.end_date = this.data.endDate
      const data = await reportApi.getOverview(params)
      this.setData({
        stats: {
          product_count: data.product_count ?? 0,
          total_stock_value: data.total_stock_value ?? '0.00',
          inbound_count: data.inbound_count ?? 0,
          inbound_quantity: data.inbound_quantity ?? 0,
          outbound_count: data.outbound_count ?? 0,
          outbound_quantity: data.outbound_quantity ?? 0,
          warning_count: data.warning_count ?? 0,
          pending_inbound_count: data.pending_inbound_count ?? 0,
          pending_outbound_count: data.pending_outbound_count ?? 0,
        },
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
