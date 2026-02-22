// components/product-card/product-card.js
Component({
  properties: {
    product: {
      type: Object,
      value: null,
    },
  },
  data: {
    cardClass: '',
    stockClass: '',
    stockText: '0',
    statusText: '正常',
    statusClass: '',
  },
  observers: {
    product(p) {
      if (!p) return
      const stock = p.stock != null ? p.stock : 0
      const minStock = p.min_stock != null ? p.min_stock : 0
      const warn = stock <= minStock
      this.setData({
        cardClass: warn ? 'warning' : '',
        stockClass: warn ? 'warn' : '',
        stockText: String(stock),
        statusText: p.status === 2 ? '已下架' : '正常',
        statusClass: p.status === 2 ? 'offline' : '',
      })
    },
  },
  methods: {
    onImageError(e) {
      console.error('[product-card] 图片加载失败', e.detail, this.properties.product?.cover_image)
    },
    onImageLoad() {
      // 调试用：图片加载成功
    },
    onTap() {
      const { product } = this.properties
      if (product && product.id) {
        this.triggerEvent('tap', { product })
      }
    },
  },
})
