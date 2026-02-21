// pages/report/statistics/statistics.js
const reportApi = require('../../../api/report')

Page({
  data: {
    type: 'inbound',
    typeTitle: '入库统计',
    startDate: '',
    endDate: '',
    groupBy: 'product',
    groupByIndex: 0,
    groupByOpts: [
      { value: 'product', label: '按商品' },
      { value: 'category', label: '按分类' },
      { value: 'day', label: '按日期' },
    ],
    list: [],
    loading: false,
  },

  onLoad(options) {
    const type = options.type || 'inbound'
    const titles = { inbound: '入库统计', outbound: '出库统计', turnover: '周转率' }
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    this.setData({
      type,
      typeTitle: titles[type] || '统计',
      startDate: this._formatDate(start),
      endDate: this._formatDate(now),
    })
    this._loadData()
  },

  onPullDownRefresh() {
    this._loadData().finally(() => wx.stopPullDownRefresh())
  },

  onDateStartChange(e) {
    this.setData({ startDate: e.detail.value })
    this._loadData()
  },

  onDateEndChange(e) {
    this.setData({ endDate: e.detail.value })
    this._loadData()
  },

  onGroupByChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const opts = this.data.groupByOpts
    const item = opts[idx]
    if (item && this.data.type !== 'turnover') {
      this.setData({ groupByIndex: idx, groupBy: item.value })
      this._loadData()
    }
  },

  _formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  async _loadData() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const params = {}
      if (this.data.startDate) params.start_date = this.data.startDate
      if (this.data.endDate) params.end_date = this.data.endDate
      if (this.data.type !== 'turnover' && this.data.groupBy) params.group_by = this.data.groupBy

      let list = []
      if (this.data.type === 'inbound') {
        list = await reportApi.getInbound(params)
      } else if (this.data.type === 'outbound') {
        list = await reportApi.getOutbound(params)
      } else {
        list = await reportApi.getTurnover(params)
      }
      this.setData({ list: Array.isArray(list) ? list : [], loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },
})
