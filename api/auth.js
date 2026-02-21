/**
 * 认证相关 API
 */
const request = require('../utils/request')

/**
 * 微信登录
 * @param {string} code - wx.login 返回的 code
 * @returns {Promise<{token, user}>}
 */
function login(code) {
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data: { code },
    needAuth: false,
  })
}

module.exports = { login }
