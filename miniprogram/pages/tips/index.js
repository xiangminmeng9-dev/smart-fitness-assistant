var httpModule = require('../../utils/request')
var http = httpModule.http
var { API } = require('../../utils/constants')

var DEFAULT_TIPS = [
  { id: 1, title: '热身很重要', content: '训练前充分热身可减少50%的受伤风险，建议进行5-10分钟的有氧运动作为热身。' },
  { id: 2, title: '蛋白质摄入时机', content: '训练后30分钟内补充蛋白质，可以最大化肌肉修复和生长效果。' },
  { id: 3, title: '睡眠与恢复', content: '每晚保证7-9小时的高质量睡眠，这是肌肉恢复和生长的关键时期。' },
  { id: 4, title: '渐进式超负荷', content: '每周增加训练量的10%左右，避免突然增加导致受伤。' },
  { id: 5, title: '补水很重要', content: '运动前2小时饮用400-600ml水，运动中每15-20分钟补充150-250ml水。' },
]

var MOTIVATIONS = [
  '坚持就是胜利，每一滴汗水都不会白费',
  '今天的努力，是明天的骄傲',
  '没有捷径，只有坚持',
  '你的身体可以做到，是你的意志需要说服',
  '每一次训练，都是对自己的投资',
]

Page({
  data: {
    dailyTip: '',
    tips: [],
    loggedIn: false,
  },

  onShow: function() {
    var token = wx.getStorageSync('token')
    this.setData({ loggedIn: !!token })
    var tipIdx = Math.floor(Math.random() * MOTIVATIONS.length)
    this.setData({ dailyTip: MOTIVATIONS[tipIdx] })
    this.loadTips()
  },

  loadTips: function() {
    var that = this
    http.get(API.SYSTEM_MOTIVATION).then(function(res) {
      if (res && (res.quote || res.text)) {
        that.setData({ dailyTip: res.quote || res.text })
      }
    }).catch(function() {})

    http.get(API.SYSTEM_TIPS).then(function(res) {
      var tips = res.items || res || []
      if (tips.length > 0) {
        that.setData({ tips: tips })
      } else {
        that.setData({ tips: DEFAULT_TIPS })
      }
    }).catch(function() {
      that.setData({ tips: DEFAULT_TIPS })
    })
  },

  onRefreshTip: function() {
    var idx = Math.floor(Math.random() * MOTIVATIONS.length)
    this.setData({ dailyTip: MOTIVATIONS[idx] })
  },

  onShareAppMessage: function() {
    return { title: '智能健身助手 - 健身贴士', path: '/pages/tips/index' }
  }
})