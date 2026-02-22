// pages/inbound/list/list.js
const inboundApi = require('../../../api/inbound')
const outboundApi = require('../../../api/outbound')
const store = require('../../../store/index')

const PAGE_SIZE = 20
const STATUS_MAP = { 1: '待审批', 2: '已确认', 3: '已拒绝' }

Page({
  data: {
    tab: 'inbound',
    status: '',
    statusIndex: 0,
    statusLabel: '全部状态',
    addBtnText: '新建入库',
    tabActiveInbound: 'active',
    tabActiveOutbound: '',
    emptyText: '暂无入库单',
    statusOpts: [
      { value: '', label: '全部状态' },
      { value: 1, label: '待审批' },
      { value: 2, label: '已确认' },
      { value: 3, label: '已拒绝' },
    ],
    list: [],
    total: 0,
    page: 1,
    loading: false,
    hasMore: true,
    isAdmin: false,
  },

  onLoad() {
    const user = store.getUser()
    this.setData({ isAdmin: user && user.role === 2 })
    this._loadList(true)
  },

  onShow() {
    const initialTab = getApp().globalData.inboundInitialTab
    getApp().globalData.inboundInitialTab = null
    if (initialTab === 'outbound') {
      this.setData({
        tab: 'outbound',
        addBtnText: '新建出库',
        emptyText: '暂无出库单',
        tabActiveInbound: '',
        tabActiveOutbound: 'active',
        page: 1,
        hasMore: true,
      })
      this._loadList(true)
      return
    }
    this._loadList(true)
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this._loadList(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.loading || !this.data.hasMore) return
    this._loadList(false)
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      tab,
      page: 1,
      hasMore: true,
      addBtnText: tab === 'inbound' ? '新建入库' : '新建出库',
      emptyText: tab === 'inbound' ? '暂无入库单' : '暂无出库单',
      tabActiveInbound: tab === 'inbound' ? 'active' : '',
      tabActiveOutbound: tab === 'outbound' ? 'active' : '',
    })
    this._loadList(true)
  },

  onStatusChange(e) {
    const idx = parseInt(e.detail.value, 10)
    const opts = this.data.statusOpts
    const item = opts[idx] || opts[0]
    this.setData({
      statusIndex: idx,
      status: item.value !== '' && item.value !== undefined ? String(item.value) : '',
      statusLabel: item.label || '全部状态',
      page: 1,
      hasMore: true,
    })
    this._loadList(true)
  },

  onAdd() {
    const { tab } = this.data
    if (tab === 'inbound') {
      wx.navigateTo({ url: '/pages/inbound/form/form' })
    } else {
      wx.navigateTo({ url: '/pages/outbound/form/form' })
    }
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item
    const { tab } = this.data
    if (tab === 'inbound') {
      wx.navigateTo({ url: `/pages/inbound/detail/detail?id=${item.id}` })
    } else {
      wx.navigateTo({ url: `/pages/outbound/detail/detail?id=${item.id}` })
    }
  },

  async _loadList(refresh) {
    if (this.data.loading) return
    const { tab, status, page, hasMore } = this.data
    if (!refresh && !hasMore) return

    this.setData({ loading: true })
    try {
      const params = { page: refresh ? 1 : page, page_size: PAGE_SIZE }
      if (status) params.status = parseInt(status, 10)

      const api = tab === 'inbound' ? inboundApi : outboundApi
      const res = await api.getList(params)
      const rawList = res.list || []
      const newList = rawList.map((item) => ({
        ...item,
        _statusText: STATUS_MAP[item.status] || '未知',
        _receiverOrSupplier: tab === 'inbound' ? item.supplier : item.receiver,
        _receiverLabel: tab === 'inbound' ? '供应商' : '收货人',
      }))
      const total = res.total || 0
      const prevList = refresh ? [] : this.data.list
      const merged = [...prevList, ...newList]

      this.setData({
        list: merged,
        total,
        page: refresh ? 2 : page + 1,
        hasMore: merged.length < total,
        loading: false,
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  },

  getStatusText(status) {
    return STATUS_MAP[status] || '未知'
  },
})
