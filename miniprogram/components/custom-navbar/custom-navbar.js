Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    bgColor: { type: String, value: 'var(--color-bg-primary)' },
    rightText: { type: String, value: '' },
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 44,
  },

  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync()
      this.setData({
        statusBarHeight: sysInfo.statusBarHeight || 20,
      })
    },
  },

  methods: {
    onBack() {
      wx.navigateBack({ delta: 1 })
    },
    onRightTap() {
      this.triggerEvent('righttap')
    },
  },
})
