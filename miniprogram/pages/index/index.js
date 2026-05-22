var { formatDate, formatDateCN } = require('../../utils/formatters')
var { getBaseUrl, API } = require('../../utils/constants')

Page({
  data: {
    loggedIn: false,
    loading: false,
    currentDate: '',
    dateDisplay: '',
    plan: null,
    hasPlan: false,
    weather: null,
    motivation: '',
    debugMsg: '',
  },

  onShow: function() {
    var token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false, loading: false })
      // Test API directly
      this.testApi()
      return
    }
    this.setData({ loggedIn: true })
    this.loadAllData()
  },

  testApi: function() {
    var that = this
    var baseUrl = getBaseUrl()
    that.setData({ debugMsg: '测试连接: ' + baseUrl })

    wx.request({
      url: baseUrl + '/api/system/motivation',
      method: 'GET',
      header: { 'Content-Type': 'application/json' },
      success: function(res) {
        var msg = 'API成功! status=' + res.statusCode + ' data=' + JSON.stringify(res.data).substring(0, 100)
        that.setData({ debugMsg: msg })
      },
      fail: function(err) {
        var msg = 'API失败! err=' + (err.errMsg || 'unknown')
        that.setData({ debugMsg: msg })
      }
    })
  },

  onPullDownRefresh: function() {
    if (this.data.loggedIn) {
      this.loadAllData()
    }
    wx.stopPullDownRefresh()
  },

  loadAllData: function() {
    var that = this
    var today = new Date()
    var dateStr = formatDate(today)
    that.setData({
      currentDate: dateStr,
      dateDisplay: formatDateCN(today),
      loading: true
    })

    that.loadPlan(dateStr)
    that.loadWeather()
    that.loadMotivation()
  },

  loadPlan: function(date) {
    var that = this
    var baseUrl = getBaseUrl()
    wx.request({
      url: baseUrl + API.PLAN_BY_DATE(date),
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          that.setData({ plan: res.data, hasPlan: true, loading: false })
        } else {
          that.setData({ plan: null, hasPlan: false, loading: false })
        }
      },
      fail: function() {
        that.setData({ plan: null, hasPlan: false, loading: false })
      }
    })
  },

  loadWeather: function() {
    var that = this
    var baseUrl = getBaseUrl()
    wx.request({
      url: baseUrl + API.SYSTEM_WEATHER,
      method: 'GET',
      header: { 'Content-Type': 'application/json' },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          that.setData({ weather: res.data })
        }
      },
      fail: function() {
        that.setData({ weather: null })
      }
    })
  },

  loadMotivation: function() {
    var that = this
    var baseUrl = getBaseUrl()
    wx.request({
      url: baseUrl + API.SYSTEM_MOTIVATION,
      method: 'GET',
      header: { 'Content-Type': 'application/json' },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          var text = (res.data && res.data.text) ? res.data.text : (res.data && res.data.quote) ? res.data.quote : '坚持就是胜利'
          that.setData({ motivation: text })
        }
      },
      fail: function() {
        that.setData({ motivation: '坚持就是胜利' })
      }
    })
  },

  onPrevDay: function() {
    var current = new Date(this.data.currentDate)
    current.setDate(current.getDate() - 1)
    var dateStr = formatDate(current)
    this.setData({
      currentDate: dateStr,
      dateDisplay: formatDateCN(current),
      loading: true
    })
    this.loadPlan(dateStr)
  },

  onNextDay: function() {
    var current = new Date(this.data.currentDate)
    current.setDate(current.getDate() + 1)
    var dateStr = formatDate(current)
    this.setData({
      currentDate: dateStr,
      dateDisplay: formatDateCN(current),
      loading: true
    })
    this.loadPlan(dateStr)
  },

  onGoLogin: function() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onGeneratePlan: function() {
    var that = this
    var baseUrl = getBaseUrl()
    var token = wx.getStorageSync('token')
    wx.showLoading({ title: '生成中...' })
    wx.request({
      url: baseUrl + API.PLAN_GENERATE,
      method: 'POST',
      data: { plan_date: that.data.currentDate },
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        wx.hideLoading()
        if (res.statusCode >= 200 && res.statusCode < 300) {
          that.setData({ plan: res.data, hasPlan: true })
          wx.showToast({ title: '计划已生成', icon: 'success' })
        } else {
          wx.showToast({ title: '生成失败', icon: 'none' })
        }
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({ title: '生成失败', icon: 'none' })
      }
    })
  },

  onToggleComplete: function() {
    var that = this
    var plan = that.data.plan
    if (!plan) return
    var baseUrl = getBaseUrl()
    var token = wx.getStorageSync('token')
    wx.request({
      url: baseUrl + API.PLAN_COMPLETE(plan.id),
      method: 'PUT',
      data: { completed: !plan.completed },
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          that.setData({ plan: res.data })
        }
      },
      fail: function() {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    })
  },

  onToggleExercise: function(e) {
    var that = this
    var groupIdx = e.currentTarget.dataset.groupindex
    var exIdx = e.currentTarget.dataset.exerciseindex
    var plan = that.data.plan
    if (!plan) return
    var baseUrl = getBaseUrl()
    var token = wx.getStorageSync('token')
    var ex = plan.plan_data.workout_groups[groupIdx].exercises[exIdx]
    wx.request({
      url: baseUrl + API.PLAN_EXERCISE_COMPLETE(plan.id),
      method: 'PUT',
      data: { group_index: groupIdx, exercise_index: exIdx, completed: !ex.completed },
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          that.setData({ plan: res.data })
        }
      },
      fail: function() {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    })
  },

  onViewFullPlan: function() {
    wx.navigateTo({ url: '/pages/plan-detail/index?date=' + this.data.currentDate })
  },

  onShareAppMessage: function() {
    return {
      title: '智能健身助手 - AI个性化健身计划',
      path: '/pages/index/index'
    }
  }
})