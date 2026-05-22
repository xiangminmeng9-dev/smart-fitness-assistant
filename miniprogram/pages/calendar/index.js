var httpModule = require('../../utils/request')
var http = httpModule.http
var { API } = require('../../utils/constants')
var { formatDate, getMonthDays, getFirstDayOfWeek } = require('../../utils/formatters')

Page({
  data: {
    loggedIn: false,
    year: 2026,
    month: 1,
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    weeks: [],
    stats: { total: 0, completed: 0, rate: '0%' },
  },

  onShow: function() {
    var token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false })
      return
    }
    this.setData({ loggedIn: true })
    var now = new Date()
    this.setData({ year: now.getFullYear(), month: now.getMonth() + 1 })
    this.loadMonthData()
  },

  loadMonthData: function() {
    var that = this
    var year = that.data.year
    var month = that.data.month
    var startDate = year + '-' + String(month).padStart(2, '0') + '-01'
    var daysInMonth = getMonthDays(year, month)
    var endDate = year + '-' + String(month).padStart(2, '0') + '-' + String(daysInMonth).padStart(2, '0')

    http.get(API.PLAN_LIST + '?start_date=' + startDate + '&end_date=' + endDate).then(function(res) {
      var plans = res.items || res || []
      var completedDates = {}
      var total = plans.length
      var completed = 0
      for (var i = 0; i < plans.length; i++) {
        if (plans[i].completed) {
          completedDates[plans[i].date] = true
          completed++
        }
      }
      var rate = total > 0 ? Math.round(completed / total * 100) + '%' : '0%'
      that.setData({
        stats: { total: total, completed: completed, rate: rate }
      })
      that.buildCalendar(completedDates)
    }).catch(function() {
      that.buildCalendar({})
    })
  },

  buildCalendar: function(completedDates) {
    var year = this.data.year
    var month = this.data.month
    var daysInMonth = getMonthDays(year, month)
    var firstDay = getFirstDayOfWeek(year, month)
    var offset = firstDay === 0 ? 6 : firstDay - 1

    var today = formatDate(new Date())
    var weeks = []
    var currentWeek = []

    for (var i = 0; i < offset; i++) {
      currentWeek.push({ day: 0, isToday: false, status: '' })
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      var isToday = dateStr === today
      var status = completedDates[dateStr] ? 'completed' : ''
      currentWeek.push({ day: d, isToday: isToday, status: status })
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: 0, isToday: false, status: '' })
      }
      weeks.push(currentWeek)
    }

    this.setData({ weeks: weeks })
  },

  onPrevMonth: function() {
    var year = this.data.year
    var month = this.data.month - 1
    if (month < 1) { month = 12; year-- }
    this.setData({ year: year, month: month })
    this.loadMonthData()
  },

  onNextMonth: function() {
    var year = this.data.year
    var month = this.data.month + 1
    if (month > 12) { month = 1; year++ }
    this.setData({ year: year, month: month })
    this.loadMonthData()
  },

  onShareAppMessage: function() {
    return { title: '智能健身助手 - 训练日历', path: '/pages/calendar/index' }
  }
})