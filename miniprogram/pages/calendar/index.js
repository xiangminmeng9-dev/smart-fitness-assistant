var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

Page({
  data: {
    loggedIn: false,
    year: 2026,
    month: 1,
    weekdays: ['一','二','三','四','五','六','日'],
    weeks: [],
    stats: { total: 0, completed: 0, rate: '0%' },
  },

  onShow: function() {
    var token = wx.getStorageSync('token')
    if (!token) { this.setData({ loggedIn: false }); return }
    this.setData({ loggedIn: true })
    var now = new Date()
    this.setData({ year: now.getFullYear(), month: now.getMonth()+1 })
    this.loadMonthData()
  },

  loadMonthData: function() {
    var that = this
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/plan/',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        var plans = (res.statusCode === 200) ? (res.data.items || res.data || []) : []
        var completed = 0
        var completedDates = {}
        for (var i = 0; i < plans.length; i++) {
          if (plans[i].completed) { completedDates[plans[i].plan_date || plans[i].date] = true; completed++ }
        }
        var rate = plans.length > 0 ? Math.round(completed/plans.length*100)+'%' : '0%'
        that.setData({ stats: { total: plans.length, completed: completed, rate: rate } })
        that.buildCalendar(completedDates)
      },
      fail: function() { that.buildCalendar({}) }
    })
  },

  buildCalendar: function(completedDates) {
    var y = this.data.year, m = this.data.month
    var daysInMonth = new Date(y, m, 0).getDate()
    var firstDay = new Date(y, m-1, 1).getDay()
    var offset = firstDay === 0 ? 6 : firstDay - 1
    var today = formatDate(new Date())
    var weeks = [], currentWeek = []
    for (var i = 0; i < offset; i++) currentWeek.push({ day: 0, isToday: false, status: '' })
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0')
      currentWeek.push({ day: d, isToday: dateStr===today, status: completedDates[dateStr]?'completed':'' })
      if (currentWeek.length===7) { weeks.push(currentWeek); currentWeek=[] }
    }
    if (currentWeek.length>0) { while(currentWeek.length<7) currentWeek.push({day:0,isToday:false,status:''}); weeks.push(currentWeek) }
    this.setData({ weeks: weeks })
  },

  onPrevMonth: function() { var y=this.data.year,m=this.data.month-1; if(m<1){m=12;y--} this.setData({year:y,month:m}); this.loadMonthData() },
  onNextMonth: function() { var y=this.data.year,m=this.data.month+1; if(m>12){m=1;y++} this.setData({year:y,month:m}); this.loadMonthData() },
})