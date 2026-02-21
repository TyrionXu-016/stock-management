// pages/inventory/check/check.js
const inventoryApi = require('../../../api/inventory')

const PAGE_SIZE = 20
const STATUS_MAP = { 1: '进行中', 2: '已完成' }

Page({
  data: {
    list: [],
    total: 0,
    page: 1,
    loading: false,
    hasMore: true,
  },

  onLoad() {
    this._loadList(true)
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this._loadList(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.loading || !this.data.hasMore) return
    this._loadList(false)
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/inventory/check-form/check-form' })
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    if (item && item.id) {
      wx.navigateTo({ url: `/pages/inventory/check-detail/check-detail?id=${item.id}` })
    }
  },

  async _loadList(refresh) {
    if (this.data.loading) return
    const { page, hasMore } = this.data
    if (!refresh && !hasMore) return

    this.setData({ loading: true })
    try {
      const params = { page: refresh ? 1 : page, page_size: PAGE_SIZE }
      const res = await inventoryApi.getChecks(params)
      const rawList = Array.isArray(res) ? res : (res.list || [])
      const newList = rawList.map((i) => ({ ...i, _statusText: STATUS_MAP[i.status] || '未知' }))
      const total = Array.isArray(res) ? res.length : (res.total || rawList.length)
      const prevList = refresh ? [] : this.data.list
      const merged = [...prevList, ...newList]

      this.setData({
        list: merged,
        total,
        page: refresh ? 2 : page + 1,
        hasMore: merged.length < total,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },
})
