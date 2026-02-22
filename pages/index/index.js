// pages/index/index.js
const store = require('../../store/index')
const reportApi = require('../../api/report')

Page({
  data: {
    nickname: '用户',
    stats: {
      product_count: 0,
      warning_count: 0,
      pending_inbound_count: 0,
      pending_outbound_count: 0,
    },
    menus: [
      { title: '商品管理', icon: '/assets/icons/product.png', path: '/pages/product/list/list', isTab: true },
      { title: '入库管理', icon: '/assets/icons/inbound.png', path: '/pages/inbound/list/list', isTab: true, tab: 'inbound' },
      { title: '出库管理', icon: '/assets/icons/outbound.png', path: '/pages/inbound/list/list', isTab: true, tab: 'outbound' },
      { title: '库存监控', icon: '/assets/icons/inventory.png', path: '/pages/inventory/overview/overview' },
      { title: '报表统计', icon: '/assets/icons/report.png', path: '/pages/report/overview/overview' },
    ],
  },

  onLoad() {
    this._loadUser()
    this._loadOverview()
  },

  onShow() {
    this._loadUser()
    this._loadOverview()
  },

  onPullDownRefresh() {
    this._loadOverview().finally(() => wx.stopPullDownRefresh())
  },

  _loadUser() {
    const user = store.getUser()
    this.setData({
      nickname: user?.nickname || '用户',
    })
  },

  async _loadOverview() {
    try {
      const data = await reportApi.getOverview()
      store.setOverview(data)
      this.setData({
        stats: {
          product_count: data.product_count ?? 0,
          warning_count: data.warning_count ?? 0,
          pending_inbound_count: data.pending_inbound_count ?? 0,
          pending_outbound_count: data.pending_outbound_count ?? 0,
        },
      })
    } catch (e) {
      // 接口未就绪时使用默认值，不阻塞页面
      this.setData({
        stats: {
          product_count: 0,
          warning_count: 0,
          pending_inbound_count: 0,
          pending_outbound_count: 0,
        },
      })
    }
  },

  onMenuTap(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.path) return
    getApp().globalData.inboundInitialTab = item.tab || null
    if (item.isTab) {
      wx.switchTab({
        url: item.path,
        fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' }),
      })
    } else {
      wx.navigateTo({
        url: item.path,
        fail: () => wx.showToast({ title: '页面跳转失败', icon: 'none' }),
      })
    }
  },
})
