App({
  globalData: {
    token: '',
    userInfo: null,
    baseUrl: ''
  },

  onLaunch() {
    const accountInfo = wx.getAccountInfoSync()
    if (accountInfo.miniProgram.envVersion === 'develop') {
      this.globalData.baseUrl = 'http://localhost:8000'
    } else {
      this.globalData.baseUrl = 'https://smart-fitness-assistant.vercel.app'
    }

    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
    // 不在这里跳转，让各页面自己判断
  }
})