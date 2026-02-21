/**
 * 出库单相关 API
 */
const { request } = require('../utils/request')

function getList(params = {}) {
  return request({ url: '/api/outbound', method: 'GET', data: params })
}

function getDetail(id) {
  return request({ url: `/api/outbound/${id}`, method: 'GET' })
}

function create(data) {
  return request({ url: '/api/outbound', method: 'POST', data })
}

function updateStatus(id, status) {
  return request({ url: `/api/outbound/${id}/status`, method: 'PUT', data: { status } })
}

module.exports = { getList, getDetail, create, updateStatus }
