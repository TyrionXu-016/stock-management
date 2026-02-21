// pages/inventory/overview/overview.js
const inventoryApi = require('../../../api/inventory')
const categoryApi = require('../../../api/category')

const PAGE_SIZE = 20

Page({
  data: {
    keyword: '',
    categoryId: '',
    categoryIndex: 0,
    categoryName: '',
    categories: [{ id: 0, name: '全部分类' }],
    isWarningOnly: false,
    list: [],
    total: 0,
    totalStock: 0,
    page: 1,
    loading: false,
    hasMore: true,
  },

  onLoad() {
    this._loadCategories()
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

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.setData({ page: 1, hasMore: true })
    this._loadList(true)
  },

  onCategoryChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const cats = this.data.categories
    const item = cats[idx]
    const id = item && item.id !== undefined ? String(item.id) : ''
    const name = item ? item.name : '全部分类'
    this.setData({ categoryIndex: idx, categoryId: id, categoryName: name, page: 1, hasMore: true })
    this._loadList(true)
  },

  onWarningSwitch(e) {
    const v = e.detail.value
    this.setData({ isWarningOnly: !!v, page: 1, hasMore: true })
    this._loadList(true)
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    if (item && item.product_id) {
      wx.navigateTo({ url: `/pages/product/detail/detail?id=${item.product_id}` })
    }
  },

  onWarning() {
    wx.navigateTo({ url: '/pages/inventory/warning/warning' })
  },

  onCheck() {
    wx.navigateTo({ url: '/pages/inventory/check/check' })
  },

  onLogs() {
    wx.navigateTo({ url: '/pages/inventory/logs/logs' })
  },

  async _loadCategories() {
    try {
      const list = await categoryApi.getList()
      const cats = [{ id: 0, name: '全部分类' }, ...(list || [])]
      this.setData({ categories: cats })
    } catch (e) {
      this.setData({ categories: [{ id: 0, name: '全部分类' }] })
    }
  },

  async _loadList(refresh) {
    if (this.data.loading) return
    const { keyword, categoryId, isWarningOnly, page, hasMore } = this.data
    if (!refresh && !hasMore) return

    this.setData({ loading: true })
    try {
      const params = { page: refresh ? 1 : page, page_size: PAGE_SIZE }
      if (keyword) params.keyword = keyword.trim()
      if (categoryId && categoryId !== '0') params.category_id = parseInt(categoryId, 10)
      if (isWarningOnly) params.is_warning = 1

      const res = await inventoryApi.getList(params)
      const rawList = res.list || []
      let totalStock = 0
      const newList = rawList.map((i) => {
        const s = i.stock != null ? i.stock : 0
        totalStock += s
        return {
          ...i,
          _stockText: String(s),
          _warnClass: i.is_warning ? 'warn' : '',
        }
      })
      const total = res.total || 0
      const prevList = refresh ? [] : this.data.list
      const merged = [...prevList, ...newList]
      const sumStock = merged.reduce((sum, i) => sum + (i.stock != null ? i.stock : 0), 0)

      this.setData({
        list: merged,
        total,
        totalStock: sumStock,
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
