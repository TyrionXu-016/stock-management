// pages/product/list/list.js
const productApi = require('../../../api/product')
const categoryApi = require('../../../api/category')

const PAGE_SIZE = 20

Page({
  data: {
    keyword: '',
    categoryId: '',
    categoryIndex: 0,
    categoryName: '',
    status: '',
    statusIndex: 0,
    statusLabel: '全部状态',
    statusOpts: [
      { value: '', label: '全部状态' },
      { value: 1, label: '正常' },
      { value: 2, label: '下架' },
    ],
    categories: [{ id: 0, name: '全部分类' }],
    list: [],
    total: 0,
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

  onStatusChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const opts = this.data.statusOpts
    const item = opts[idx] || opts[0]
    this.setData({
      statusIndex: idx,
      status: item.value !== undefined && item.value !== '' ? String(item.value) : '',
      statusLabel: item.label || '全部状态',
      page: 1,
      hasMore: true,
    })
    this._loadList(true)
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/product/form/form' })
  },

  onCategoryManage() {
    wx.navigateTo({ url: '/pages/category/list/list' })
  },

  onCardTap(e) {
    const { product } = e.detail
    if (product && product.id) {
      wx.navigateTo({ url: `/pages/product/detail/detail?id=${product.id}` })
    }
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
    const { keyword, categoryId, status, page, hasMore } = this.data
    if (!refresh && !hasMore) return

    this.setData({ loading: true })
    try {
      const params = {
        page: refresh ? 1 : page,
        page_size: PAGE_SIZE,
      }
      if (keyword) params.keyword = keyword.trim()
      if (categoryId && categoryId !== '0') params.category_id = parseInt(categoryId, 10)
      if (status !== undefined && status !== '') params.status = parseInt(status, 10)

      const res = await productApi.getList(params)
      const newList = res.list || []
      const total = res.total || 0
      const prevList = refresh ? [] : this.data.list
      const merged = [...prevList, ...newList]
      const nextPage = refresh ? 2 : page + 1

      this.setData({
        list: merged,
        total,
        page: nextPage,
        hasMore: merged.length < total,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },
})
