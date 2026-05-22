var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

function formatDateCN(d) {
  var w = ['周日','周一','周二','周三','周四','周五','周六']
  return (d.getMonth()+1) + '月' + d.getDate() + '日 ' + w[d.getDay()]
}

Page({
  data: {
    loggedIn: false,
    loading: false,
    currentDate: '',
    dateDisplay: '',
    plan: null,
    hasPlan: false,
    weather: null,
    motivation: '坚持就是胜利',
    debugMsg: '',
  },

  onShow: function() {
    var token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false, loading: false, debugMsg: '未登录' })
      this.testApi()
      return
    }
    this.setData({ loggedIn: true, debugMsg: '已登录' })
    this.loadAllData()
  },

  testApi: function() {
    var that = this
    that.setData({ debugMsg: '测试API...' })
    wx.request({
      url: BASE_URL + '/api/system/motivation',
      method: 'GET',
      success: function(res) {
        that.setData({ debugMsg: 'API OK(' + res.statusCode + '): ' + JSON.stringify(res.data).substring(0, 100) })
      },
      fail: function(err) {
        that.setData({ debugMsg: 'API FAIL: ' + err.errMsg })
      }
    })
  },

  loadAllData: function() {
    var that = this
    var today = new Date()
    that.setData({ currentDate: formatDate(today), dateDisplay: formatDateCN(today), loading: true, debugMsg: '加载数据...' })
    that.loadPlan(formatDate(today))
    that.loadMotivation()
  },

  loadPlan: function(date) {
    var that = this
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/plan/' + date,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200) {
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

  loadMotivation: function() {
    var that = this
    wx.request({
      url: BASE_URL + '/api/system/motivation',
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({ motivation: res.data.text || res.data.quote || '坚持就是胜利' })
        }
      },
      fail: function() {}
    })
  },

  onGoLogin: function() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onPrevDay: function() {
    var d = new Date(this.data.currentDate)
    d.setDate(d.getDate() - 1)
    this.setData({ currentDate: formatDate(d), dateDisplay: formatDateCN(d) })
    this.loadPlan(formatDate(d))
  },

  onNextDay: function() {
    var d = new Date(this.data.currentDate)
    d.setDate(d.getDate() + 1)
    this.setData({ currentDate: formatDate(d), dateDisplay: formatDateCN(d) })
    this.loadPlan(formatDate(d))
  },

  onGeneratePlan: function() {
    var that = this
    var token = wx.getStorageSync('token')
    wx.showLoading({ title: '生成中...' })
    wx.request({
      url: BASE_URL + '/api/plan/generate',
      method: 'POST',
      data: { plan_date: that.data.currentDate },
      header: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      success: function(res) {
        wx.hideLoading()
        if (res.statusCode === 200) {
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
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/plan/' + plan.id + '/complete?action=' + (plan.completed ? 'cancel' : 'complete'),
      method: 'PUT',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200) { that.setData({ plan: res.data }) }
      },
      fail: function() {}
    })
  },

  onToggleExercise: function(e) {
    var that = this
    var gi = e.currentTarget.dataset.groupindex
    var ei = e.currentTarget.dataset.exerciseindex
    var plan = that.data.plan
    if (!plan) return
    var ex = plan.plan_data.workout_groups[gi].exercises[ei]
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/plan/' + plan.id + '/exercise-complete',
      method: 'PUT',
      data: { group_index: gi, exercise_index: ei, completed: !ex.completed },
      header: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      success: function(res) {
        if (res.statusCode === 200) { that.setData({ plan: res.data }) }
      },
      fail: function() {}
    })
  },

  onViewFullPlan: function() {
    wx.navigateTo({ url: '/pages/plan-detail/index?date=' + this.data.currentDate })
  },
})