// pages/user/edit/edit.js
const userApi = require('../../../api/user')
const store = require('../../../store/index')

Page({
  data: {
    nickname: '',
    avatar: '',
    phone: '',
    submitting: false,
  },

  onLoad() {
    const user = store.getUser()
    if (user) {
      this.setData({
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
      })
    }
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onChooseAvatar(e) {
    const url = e.detail.avatarUrl
    if (url) this.setData({ avatar: url })
  },

  async onSubmit() {
    if (this.data.submitting) return
    this.setData({ submitting: true })
    try {
      const payload = {
        nickname: (this.data.nickname || '').trim(),
        phone: (this.data.phone || '').trim(),
      }
      if (this.data.avatar) payload.avatar = this.data.avatar
      await userApi.updateProfile(payload)
      store.setUser({ ...store.getUser(), ...payload })
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      this.setData({ submitting: false })
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
    }
  },
})
