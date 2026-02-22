/**
 * 图片上传工具
 */
const config = require('./config')
const auth = require('./auth')

/**
 * 上传图片
 * @param {string} filePath - wx.chooseImage 返回的临时路径
 * @returns {Promise<string>} 图片访问 URL
 */
function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: config.baseUrl + '/api/upload/image',
      filePath,
      name: 'file',
      header: {
        Authorization: 'Bearer ' + (auth.getToken() || ''),
      },
      success(res) {
        const data = JSON.parse(res.data || '{}')
        if (data.code === 0 && data.data && data.data.url) {
          resolve(data.data.url)
        } else {
          reject({ message: data.message || '上传失败' })
        }
      },
      fail(err) {
        reject({ message: err.errMsg || '上传失败' })
      },
    })
  })
}

module.exports = { uploadImage }
