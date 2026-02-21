/**
 * 认证相关 API
 */
const { request } = require('../utils/request')

/**
 * 微信登录
 * @param {string} code - wx.login 返回的 code
 * @param {Object} [userInfo] - 可选，来自 wx.getUserProfile 或 头像昵称填写，含 nickname/avatarUrl
 * @returns {Promise<{token, user}>}
 */
function login(code, userInfo = null) {
  const data = { code }
  if (userInfo) {
    if (userInfo.nickName) data.nickname = userInfo.nickName
    if (userInfo.avatarUrl) data.avatar = userInfo.avatarUrl
    if (userInfo.nickname) data.nickname = userInfo.nickname
    if (userInfo.avatar) data.avatar = userInfo.avatar
  }
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data,
    needAuth: false,
  })
}

module.exports = { login }
