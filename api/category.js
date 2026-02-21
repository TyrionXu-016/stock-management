/**
 * 商品分类相关 API
 */
const { request } = require('../utils/request')

/**
 * 获取分类列表
 * @param {number} [parentId=0] - 父分类ID，0 为顶级
 */
function getList(parentId = 0) {
  return request({
    url: '/api/categories',
    method: 'GET',
    data: parentId ? { parent_id: parentId } : {},
  })
}

/**
 * 获取扁平化分类列表（用于选择器）
 */
function getListFlat() {
  return request({
    url: '/api/categories',
    method: 'GET',
    data: {},
  }).then((list) => {
    const flat = []
    function walk(items) {
      (items || []).forEach((item) => {
        flat.push(item)
        if (item.children && item.children.length) walk(item.children)
      })
    }
    walk(list)
    return flat
  })
}

/**
 * 创建分类
 * @param {Object} data - { name, parent_id, sort }
 */
function create(data) {
  return request({
    url: '/api/categories',
    method: 'POST',
    data,
  })
}

/**
 * 更新分类
 * @param {number} id - 分类ID
 * @param {Object} data - { name, sort }
 */
function update(id, data) {
  return request({
    url: `/api/categories/${id}`,
    method: 'PUT',
    data,
  })
}

/**
 * 删除分类
 * @param {number} id - 分类ID
 */
function remove(id) {
  return request({
    url: `/api/categories/${id}`,
    method: 'DELETE',
  })
}

module.exports = {
  getList,
  getListFlat,
  create,
  update,
  remove,
}
