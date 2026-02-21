// pages/user/profile/profile.js
const store = require('../../../store/index')
const userApi = require('../../../api/user')

Page({
  data: {
    user: null,
    loading: false,
  },

  onLoad() {
    this._loadProfile()
  },

  onShow() {
    this._loadProfile()
  },

  async _loadProfile() {
    const cached = store.getUser()
    this.setData({ user: cached })

    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const user = await userApi.getProfile()
      store.setUser(user)
      this.setData({ user })
    } catch (e) {
      // 未登录或接口未就绪，使用缓存
      if (!cached) {
        wx.showToast({ title: e.message || '获取失败', icon: 'none' })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  onEdit() {
    wx.navigateTo({
      url: '/pages/user/edit/edit',
      fail: () => wx.showToast({ title: '功能开发中', icon: 'none' }),
    })
  },

  onSettings() {
    wx.navigateTo({
      url: '/pages/user/settings/settings',
      fail: () => wx.showToast({ title: '功能开发中', icon: 'none' }),
    })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          store.clearUser()
          wx.reLaunch({ url: '/pages/login/login' })
        }
      },
    })
  },
})
