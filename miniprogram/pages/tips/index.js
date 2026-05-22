var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

var DEFAULT_TIPS = [
  { id:1, title:'热身很重要', content:'训练前充分热身可减少50%的受伤风险' },
  { id:2, title:'蛋白质摄入', content:'训练后30分钟内补充蛋白质效果最佳' },
  { id:3, title:'睡眠恢复', content:'每晚7-9小时高质量睡眠是肌肉恢复关键' },
]
var MOTIVATIONS = ['坚持就是胜利','今天的努力是明天的骄傲','没有捷径只有坚持']

Page({
  data: { dailyTip: '坚持就是胜利', tips: [] },

  onShow: function() {
    var idx = Math.floor(Math.random()*MOTIVATIONS.length)
    this.setData({ dailyTip: MOTIVATIONS[idx] })
    this.loadTips()
  },

  loadTips: function() {
    var that = this
    wx.request({
      url: BASE_URL + '/api/system/motivation',
      success: function(res) {
        if (res.statusCode===200 && res.data && (res.data.text||res.data.quote)) {
          that.setData({ dailyTip: res.data.text || res.data.quote })
        }
      },
      fail: function() {}
    })
    wx.request({
      url: BASE_URL + '/api/system/tips',
      success: function(res) {
        if (res.statusCode===200) {
          var tips = res.data.items || res.data || []
          if (tips.length>0) that.setData({ tips: tips })
        }
      },
      fail: function() { that.setData({ tips: DEFAULT_TIPS }) }
    })
  },

  onRefreshTip: function() {
    var idx = Math.floor(Math.random()*MOTIVATIONS.length)
    this.setData({ dailyTip: MOTIVATIONS[idx] })
  },
})