// pages/category/form/form.js
const categoryApi = require('../../../api/category')

Page({
  data: {
    id: null,
    isEdit: false,
    parentCategories: [],
    parentIndex: 0,
    parentName: '',
    form: {
      name: '',
      parent_id: 0,
      sort: 0,
    },
    submitting: false,
  },

  onLoad(options) {
    const id = options.id ? parseInt(options.id, 10) : null
    const isEdit = !!id
    this.setData({ id, isEdit, submitText: isEdit ? '保存' : '添加' })
    if (id) {
      this._loadCategory(id)
    } else {
      this._loadParents()
    }
  },

  async _loadParents() {
    try {
      const list = await categoryApi.getList()
      const parents = [{ id: 0, name: '无（顶级分类）' }, ...(list || [])]
      this.setData({ parentCategories: parents })
    } catch (e) {
      this.setData({ parentCategories: [{ id: 0, name: '无（顶级分类）' }] })
    }
  },

  async _loadCategory(id) {
    try {
      const list = await categoryApi.getList()
      const parents = [{ id: 0, name: '无（顶级分类）' }, ...(list || [])]
      const flat = this._flatten(list || [])
      const item = flat.find((c) => c.id === id)
      if (!item) throw new Error('分类不存在')
      const parentId = item.parent_id || 0
      const idx = parents.findIndex((c) => c.id === parentId)
      const pi = idx >= 0 ? idx : 0
      const pn = parents[pi] ? parents[pi].name : ''
      this.setData({
        parentCategories: parents,
        form: {
          name: item.name || '',
          parent_id: parentId,
          sort: item.sort ?? 0,
        },
        parentIndex: pi,
        parentName: pn,
      })
    } catch (e) {
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  _flatten(list) {
    const flat = []
    ;(list || []).forEach((item) => {
      flat.push(item)
      if (item.children && item.children.length) {
        flat.push(...this._flatten(item.children))
      }
    })
    return flat
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    let v = value
    if (field === 'sort') v = parseInt(value, 10) || 0
    this.setData({ [`form.${field}`]: v })
  },

  onParentPick(e) {
    const idx = parseInt(e.detail.value, 10)
    const parents = this.data.parentCategories
    const item = parents[idx]
    this.setData({
      'form.parent_id': item ? item.id : 0,
      parentIndex: idx,
      parentName: item ? item.name : '',
    })
  },

  async onSubmit() {
    const { form, id, isEdit, submitting } = this.data
    if (submitting) return
    if (!form.name || !form.name.trim()) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const payload = {
        name: form.name.trim(),
        parent_id: form.parent_id || 0,
        sort: parseInt(form.sort, 10) || 0,
      }
      if (isEdit) {
        await categoryApi.update(id, { name: payload.name, sort: payload.sort })
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        await categoryApi.create(payload)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      this.setData({ submitting: false })
      wx.showToast({ title: e.message || '操作失败', icon: 'none' })
    }
  },

  onCancel() {
    wx.navigateBack()
  },
})
