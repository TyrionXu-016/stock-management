// app.js
const auth = require('./utils/auth')

App({
  onLaunch() {
    // 未登录则跳转登录页
    if (!auth.getToken()) {
      wx.reLaunch({ url: '/pages/login/login' })
    }
  },

  onShow() {
    // 每次从后台进入时，可在此做 token 校验或刷新
  },

  globalData: {
    userInfo: null,
  },
})
