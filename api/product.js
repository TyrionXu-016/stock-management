/**
 * 商品相关 API
 */
const { request } = require('../utils/request')

/**
 * 获取商品列表
 * @param {Object} params - { keyword, category_id, status, page, page_size }
 */
function getList(params = {}) {
  return request({
    url: '/api/products',
    method: 'GET',
    data: params,
  })
}

/**
 * 获取商品详情
 * @param {number} id - 商品ID
 */
function getDetail(id) {
  return request({
    url: `/api/products/${id}`,
    method: 'GET',
  })
}

/**
 * 创建商品
 * @param {Object} data - 商品信息
 */
function create(data) {
  return request({
    url: '/api/products',
    method: 'POST',
    data,
  })
}

/**
 * 更新商品
 * @param {number} id - 商品ID
 * @param {Object} data - 更新的字段
 */
function update(id, data) {
  return request({
    url: `/api/products/${id}`,
    method: 'PUT',
    data,
  })
}

/**
 * 删除商品
 * @param {number} id - 商品ID
 */
function remove(id) {
  return request({
    url: `/api/products/${id}`,
    method: 'DELETE',
  })
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  remove,
}
