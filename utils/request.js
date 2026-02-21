/**
 * 网络请求封装
 * 统一处理 baseUrl、Authorization、错误码
 */
const config = require('./config')
const auth = require('./auth')

/**
 * 发起请求
 * @param {Object} options - wx.request 参数
 * @param {string} options.url - 接口路径，如 /api/auth/login
 * @param {string} [options.method='GET'] - 请求方法
 * @param {Object} [options.data] - 请求体
 * @param {boolean} [options.needAuth=true] - 是否需要携带 token
 * @returns {Promise<Object>} 返回 data 字段
 */
function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    needAuth = true,
  } = options

  return new Promise((resolve, reject) => {
    const token = auth.getToken()
    if (needAuth && !token) {
      reject({ code: 401, message: '请先登录' })
      return
    }

    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    }
    if (needAuth && token) {
      header['Authorization'] = 'Bearer ' + token
    }

    wx.request({
      url: config.baseUrl + url,
      method,
      data,
      header,
      success(res) {
        const { statusCode, data: resData } = res
        if (statusCode >= 200 && statusCode < 300) {
          const code = resData?.code ?? -1
          if (code === 0) {
            resolve(resData.data)
          } else {
            reject({
              code: resData.code,
              message: resData.message || '请求失败',
              data: resData.data,
            })
          }
        } else if (statusCode === 401) {
          auth.logout()
          wx.reLaunch({ url: '/pages/login/login' })
          reject({ code: 401, message: '登录已过期，请重新登录' })
        } else {
          reject({
            code: statusCode,
            message: resData?.message || '网络请求失败',
          })
        }
      },
      fail(err) {
        reject({
          code: -1,
          message: err.errMsg || '网络连接失败',
        })
      },
    })
  })
}

module.exports = { request }
