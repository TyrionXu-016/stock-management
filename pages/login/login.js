// pages/login/login.js
const auth = require('../../utils/auth')
const authApi = require('../../api/auth')
const store = require('../../store/index')

Page({
  data: {
    agreeProtocol: false,
    loading: false,
  },

  onLoad(options) {
    // 已有 token 则直接进首页
    if (auth.isLoggedIn()) {
      this._redirectHome(options)
      return
    }
  },

  onAgreeChange(e) {
    this.setData({ agreeProtocol: !!e.detail.value.length })
  },

  async onLogin() {
    const { agreeProtocol, loading } = this.data
    if (!agreeProtocol) {
      wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
      return
    }
    if (loading) return

    this.setData({ loading: true })
    try {
      const { code } = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        })
      })
      const { token, user } = await authApi.login(code)
      auth.saveLoginData(token, user)
      store.setUser(user)
      wx.showToast({ title: '登录成功', icon: 'success' })
      this._redirectHome()
    } catch (err) {
      wx.showToast({
        title: err.message || '登录失败',
        icon: 'none',
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  _redirectHome(options = {}) {
    const redirect = options.redirect
    if (redirect) {
      wx.redirectTo({ url: decodeURIComponent(redirect), fail: () => wx.switchTab({ url: '/pages/index/index' }) })
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },
})
