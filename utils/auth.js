/**
 * 认证与登录状态管理
 */
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * 获取本地存储的 token
 */
function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 保存 token
 */
function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

/**
 * 移除 token
 */
function removeToken() {
  wx.removeStorageSync(TOKEN_KEY)
}

/**
 * 获取本地缓存的用户信息
 */
function getUser() {
  try {
    const str = wx.getStorageSync(USER_KEY)
    return str ? JSON.parse(str) : null
  } catch (e) {
    return null
  }
}

/**
 * 保存用户信息到本地
 */
function setUser(user) {
  wx.setStorageSync(USER_KEY, JSON.stringify(user || {}))
}

/**
 * 清除用户信息
 */
function removeUser() {
  wx.removeStorageSync(USER_KEY)
}

/**
 * 是否已登录（有有效 token）
 */
function isLoggedIn() {
  return !!getToken()
}

/**
 * 退出登录：清除本地 token 和用户信息
 */
function logout() {
  removeToken()
  removeUser()
}

/**
 * 登录成功后保存 token 和用户信息
 */
function saveLoginData(token, user) {
  setToken(token)
  setUser(user)
}

module.exports = {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  isLoggedIn,
  logout,
  saveLoginData,
}
