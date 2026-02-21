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
      { title: '商品管理', icon: 'box', path: '/pages/product/list/list', color: '#0f766e' },
      { title: '入库管理', icon: 'down', path: '/pages/inbound/list/list', color: '#059669' },
      { title: '出库管理', icon: 'up', path: '/pages/outbound/list/list', color: '#0284c7' },
      { title: '库存监控', icon: 'chart', path: '/pages/inventory/overview/overview', color: '#7c3aed' },
      { title: '报表统计', icon: 'stats', path: '/pages/report/overview/overview', color: '#c2410c' },
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
    const path = e.currentTarget.dataset.path
    if (!path) return
    // 第二阶段起才有这些页面，暂时提示
    wx.navigateTo({
      url: path,
      fail: () => wx.showToast({ title: '功能开发中', icon: 'none' }),
    })
  },
})
