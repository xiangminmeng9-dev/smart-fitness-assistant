App({
  globalData: {
    token: ''
  },
  onLaunch: function() {
    var token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  }
})