// pages/product/select/select.js - 商品选择页，用于出入库表单
const productApi = require('../../../api/product')

const PAGE_SIZE = 50

Page({
  data: {
    keyword: '',
    list: [],
    loading: false,
  },

  onLoad(options) {
    this._loadList()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this._loadList()
  },

  async _loadList() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const params = { page: 1, page_size: PAGE_SIZE, status: 1 }
      if (this.data.keyword) params.keyword = this.data.keyword.trim()
      const res = await productApi.getList(params)
      this.setData({ list: res.list || [], loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onSelect(e) {
    const product = e.currentTarget.dataset.product
    if (product) {
      getApp().globalData.pendingProductSelect = product
      wx.navigateBack()
    }
  },
})
