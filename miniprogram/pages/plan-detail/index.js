var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

Page({
  data: { plan: null, date: '', loading: true },

  onLoad: function(options) {
    if (options && options.date) {
      this.setData({ date: options.date })
      this.loadPlan(options.date)
    }
  },

  loadPlan: function(date) {
    var that = this, token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/plan/' + date,
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        that.setData({ plan: res.statusCode===200 ? res.data : null, loading: false })
      },
      fail: function() { that.setData({ loading: false }) }
    })
  },
})