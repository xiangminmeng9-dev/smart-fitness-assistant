var httpModule = require('../../utils/request')
var http = httpModule.http
var { formatDate, formatDateCN } = require('../../utils/formatters')
var { API } = require('../../utils/constants')

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
  },

  onShow: function() {
    var token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false, loading: false })
      return
    }
    this.setData({ loggedIn: true })
    this.loadAllData()
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
    http.get(API.PLAN_BY_DATE(date)).then(function(res) {
      that.setData({
        plan: res,
        hasPlan: true,
        loading: false
      })
    }).catch(function() {
      that.setData({
        plan: null,
        hasPlan: false,
        loading: false
      })
    })
  },

  loadWeather: function() {
    var that = this
    var location = wx.getStorageSync('user_location') || ''
    http.get(API.SYSTEM_WEATHER + (location ? '?location=' + location : '')).then(function(res) {
      that.setData({ weather: res })
    }).catch(function() {
      that.setData({ weather: null })
    })
  },

  loadMotivation: function() {
    var that = this
    http.get(API.SYSTEM_MOTIVATION).then(function(res) {
      var text = (res && res.text) ? res.text : '坚持就是胜利'
      that.setData({ motivation: text })
    }).catch(function() {
      that.setData({ motivation: '坚持就是胜利' })
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
    wx.showLoading({ title: '生成中...' })
    http.post(API.PLAN_GENERATE + '?date=' + that.data.currentDate).then(function(res) {
      wx.hideLoading()
      that.setData({ plan: res, hasPlan: true })
      wx.showToast({ title: '计划已生成', icon: 'success' })
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: '生成失败', icon: 'none' })
    })
  },

  onToggleComplete: function() {
    var that = this
    var plan = that.data.plan
    if (!plan) return

    var action = plan.completed ? 'cancel' : 'complete'
    http.put(API.PLAN_COMPLETE(plan.id) + '?action=' + action).then(function(res) {
      that.setData({ plan: res })
      if (res.completed) {
        wx.vibrateShort({ type: 'light' })
      }
    }).catch(function() {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },

  onToggleExercise: function(e) {
    var that = this
    var groupIdx = e.currentTarget.dataset.groupindex
    var exIdx = e.currentTarget.dataset.exerciseindex
    var plan = that.data.plan
    if (!plan) return

    var ex = plan.plan_data.workout_groups[groupIdx].exercises[exIdx]
    http.put(API.PLAN_EXERCISE_COMPLETE(plan.id), {
      group_index: groupIdx,
      exercise_index: exIdx,
      completed: !ex.completed
    }).then(function(res) {
      that.setData({ plan: res })
    }).catch(function() {
      wx.showToast({ title: '操作失败', icon: 'none' })
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