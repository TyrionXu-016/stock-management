// pages/user/settings/settings.js
const store = require('../../../store/index')

Page({
  data: {
    version: '1.0.0',
  },

  onCategory() {
    wx.navigateTo({ url: '/pages/category/list/list' })
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          store.clearUser()
          wx.showToast({ title: '已清除', icon: 'success' })
          setTimeout(() => wx.reLaunch({ url: '/pages/login/login' }), 1000)
        }
      },
    })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) {
          store.clearUser()
          wx.reLaunch({ url: '/pages/login/login' })
        }
      },
    })
  },
})
