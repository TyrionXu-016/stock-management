/**
 * 用户相关 API
 */
const request = require('../utils/request')

/**
 * 获取当前用户信息
 */
function getProfile() {
  return request({
    url: '/api/user/profile',
    method: 'GET',
  })
}

/**
 * 更新用户信息
 * @param {Object} data - { nickname, avatar, phone }
 */
function updateProfile(data) {
  return request({
    url: '/api/user/profile',
    method: 'PUT',
    data,
  })
}

module.exports = {
  getProfile,
  updateProfile,
}
