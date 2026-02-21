// pages/inventory/logs/logs.js
const inventoryApi = require('../../../api/inventory')

const PAGE_SIZE = 20
const TYPE_MAP = { 1: '入库', 2: '出库', 3: '盘点' }

Page({
  data: {
    productId: '',
    changeType: '',
    typeIndex: 0,
    typeOpts: [
      { value: '', label: '全部类型' },
      { value: 1, label: '入库' },
      { value: 2, label: '出库' },
      { value: 3, label: '盘点' },
    ],
    typeLabel: '全部类型',
    list: [],
    total: 0,
    page: 1,
    loading: false,
    hasMore: true,
  },

  onLoad(options) {
    const productId = options.product_id || ''
    this.setData({ productId })
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

  onTypeChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const opts = this.data.typeOpts
    const item = opts[idx] || opts[0]
    this.setData({
      typeIndex: idx,
      changeType: item.value !== '' && item.value !== undefined ? String(item.value) : '',
      typeLabel: item.label || '全部类型',
      page: 1,
      hasMore: true,
    })
    this._loadList(true)
  },

  async _loadList(refresh) {
    if (this.data.loading) return
    const { productId, changeType, page, hasMore } = this.data
    if (!refresh && !hasMore) return

    this.setData({ loading: true })
    try {
      const params = { page: refresh ? 1 : page, page_size: PAGE_SIZE }
      if (productId) params.product_id = parseInt(productId, 10)
      if (changeType) params.change_type = parseInt(changeType, 10)

      const res = await inventoryApi.getLogs(params)
      const rawList = res.list || []
      const newList = rawList.map((i) => ({ ...i, _typeText: TYPE_MAP[i.change_type] || '未知' }))
      const total = res.total || 0
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
