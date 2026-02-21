/**
 * 库存相关 API
 */
const { request } = require('../utils/request')

function getList(params = {}) {
  return request({ url: '/api/inventory', method: 'GET', data: params })
}

function getWarning() {
  return request({ url: '/api/inventory/warning', method: 'GET' })
}

function getLogs(params = {}) {
  return request({ url: '/api/inventory/logs', method: 'GET', data: params })
}

function getChecks(params = {}) {
  return request({ url: '/api/inventory/checks', method: 'GET', data: params })
}

function getCheckDetail(id) {
  return request({ url: `/api/inventory/checks/${id}`, method: 'GET' })
}

function createCheck(data) {
  return request({ url: '/api/inventory/check', method: 'POST', data })
}

module.exports = {
  getList,
  getWarning,
  getLogs,
  getChecks,
  getCheckDetail,
  createCheck,
}
