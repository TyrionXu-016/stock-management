/**
 * 入库单相关 API
 */
const { request } = require('../utils/request')

function getList(params = {}) {
  return request({ url: '/api/inbound', method: 'GET', data: params })
}

function getDetail(id) {
  return request({ url: `/api/inbound/${id}`, method: 'GET' })
}

function create(data) {
  return request({ url: '/api/inbound', method: 'POST', data })
}

function updateStatus(id, status) {
  return request({ url: `/api/inbound/${id}/status`, method: 'PUT', data: { status } })
}

module.exports = { getList, getDetail, create, updateStatus }
