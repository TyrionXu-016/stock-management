// pages/category/list/list.js
const categoryApi = require('../../../api/category')
const store = require('../../../store/index')

Page({
  data: {
    list: [],
    loading: false,
    isAdmin: false,
  },

  onLoad() {
    const user = store.getUser()
    this.setData({ isAdmin: user && user.role === 2 })
    this._loadList()
  },

  onShow() {
    this._loadList()
  },

  onPullDownRefresh() {
    this._loadList().finally(() => wx.stopPullDownRefresh())
  },

  _flatten(list, level = 0) {
    const flat = []
    ;(list || []).forEach((item) => {
      flat.push({ ...item, _level: level, _sort: item.sort != null ? item.sort : 0 })
      if (item.children && item.children.length) {
        flat.push(...this._flatten(item.children, level + 1))
      }
    })
    return flat
  },

  async _loadList() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const list = await categoryApi.getList()
      const flat = this._flatten(list || [])
      this.setData({ list: flat, loading: false })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/category/form/form' })
  },

  onEdit(e) {
    const item = e.currentTarget.dataset.item
    if (item) wx.navigateTo({ url: `/pages/category/form/form?id=${item.id}` })
  },

  onDelete(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !this.data.isAdmin) return
    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类「${item.name}」吗？如有子分类或关联商品将无法删除。`,
      confirmColor: '#dc2626',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await categoryApi.remove(item.id)
          wx.showToast({ title: '删除成功', icon: 'success' })
          this._loadList()
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' })
        }
      },
    })
  },
})
