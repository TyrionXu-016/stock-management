/**
 * 报表相关 API
 */
const { request } = require('../utils/request')

function getOverview(params = {}) {
  return request({ url: '/api/report/overview', method: 'GET', data: params })
}

function getInbound(params = {}) {
  return request({ url: '/api/report/inbound', method: 'GET', data: params })
}

function getOutbound(params = {}) {
  return request({ url: '/api/report/outbound', method: 'GET', data: params })
}

function getTurnover(params = {}) {
  return request({ url: '/api/report/turnover', method: 'GET', data: params })
}

module.exports = { getOverview, getInbound, getOutbound, getTurnover }
