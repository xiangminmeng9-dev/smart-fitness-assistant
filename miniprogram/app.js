App({
  globalData: {
    token: '',
    userInfo: null,
    baseUrl: 'https://smart-fitness-assistant.vercel.app'
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  }
})