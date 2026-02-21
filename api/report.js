/**
 * 报表相关 API
 */
const request = require('../utils/request')

/**
 * 获取报表概览
 * @param {Object} [params] - { start_date, end_date }
 */
function getOverview(params = {}) {
  return request({
    url: '/api/report/overview',
    method: 'GET',
    data: params,
  })
}

module.exports = { getOverview }
