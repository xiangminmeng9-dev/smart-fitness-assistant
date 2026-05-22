const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')

Page({
  data: {
    username: '',
    profile: null,
    stats: { total: 0, completed: 0, rate: '0%' },
    loggedIn: false,
  },

  onShow() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false })
      return
    }
    this.setData({ loggedIn: true })
    this.loadProfile()
    this.loadStats()
  },

  async loadProfile() {
    try {
      const profile = await http.get(API.USER_PROFILE)
      this.setData({ profile })
    } catch (e) {
      console.error('loadProfile', e)
    }
  },

  async loadStats() {
    try {
      const plans = await http.get(API.PLAN_LIST)
      let total = 0, completed = 0
      if (Array.isArray(plans)) {
        plans.forEach(p => {
          total++
          if (p.completed) completed++
        })
      }
      const rate = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%'
      this.setData({ stats: { total, completed, rate } })
    } catch (e) {
      console.error('loadStats', e)
    }
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile/index' })
  },

  onSettings() {
    wx.navigateTo({ url: '/pages/settings/index' })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需要重新登录',
      success(res) {
        if (res.confirm) {
          wx.removeStorageSync('token')
          wx.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  },
})