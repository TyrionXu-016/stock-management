/**
 * 简单全局状态管理
 * 用于跨页面共享用户信息、报表概览等
 */
const auth = require('../utils/auth')

const store = {
  user: null,
  overview: null,
}

/**
 * 获取当前用户（优先内存，其次本地缓存）
 */
function getUser() {
  if (store.user) return store.user
  store.user = auth.getUser()
  return store.user
}

/**
 * 设置当前用户（同时更新本地缓存）
 */
function setUser(user) {
  store.user = user
  auth.setUser(user)
}

/**
 * 清除用户（登出时调用）
 */
function clearUser() {
  store.user = null
  auth.logout()
}

/**
 * 获取报表概览（首页用）
 */
function getOverview() {
  return store.overview
}

/**
 * 设置报表概览
 */
function setOverview(data) {
  store.overview = data
}

module.exports = {
  getUser,
  setUser,
  clearUser,
  getOverview,
  setOverview,
}
