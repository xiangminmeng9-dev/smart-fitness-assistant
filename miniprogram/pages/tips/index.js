const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')

Page({
  data: {
    dailyTip: '训练前充分热身可减少50%受伤风险',
    tips: [],
    loggedIn: false,
  },

  onShow() {
    const token = wx.getStorageSync('token')
    this.setData({ loggedIn: !!token })
    if (token) {
      this.loadTips()
    }
  },

  async loadTips() {
    try {
      const [motivationRes, tipsRes] = await Promise.allSettled([
        http.get(API.SYSTEM_MOTIVATION),
        http.get(API.SYSTEM_TIPS),
      ])
      if (motivationRes.status === 'fulfilled' && motivationRes.value?.quote) {
        this.setData({ dailyTip: motivationRes.value.quote })
      }
      if (tipsRes.status === 'fulfilled' && Array.isArray(tipsRes.value)) {
        this.setData({ tips: tipsRes.value })
      }
    } catch (e) {
      console.error('loadTips', e)
    }
  },

  onRefreshTip() {
    this.loadTips()
  },

  onShareAppMessage() {
    return {
      title: '健身贴士 - 智能健身助手',
      path: '/pages/tips/index',
    }
  },
})