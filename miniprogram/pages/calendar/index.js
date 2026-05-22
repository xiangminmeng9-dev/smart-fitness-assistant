const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')
const { formatDate } = require('../../utils/formatters')

Page({
  data: {
    year: 2026,
    month: 1,
    weeks: [],
    completedDates: [],
    stats: { total: 0, completed: 0, rate: '0%' },
    today: '',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    loggedIn: false,
  },

  onLoad() {
    const now = new Date()
    this.setData({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      today: formatDate(now),
    })
  },

  onShow() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false })
      return
    }
    this.setData({ loggedIn: true })
    this.loadMonthData()
  },

  async loadMonthData() {
    try {
      const plans = await http.get(API.PLAN_LIST)
      const completedDates = []
      let total = 0, completed = 0
      if (Array.isArray(plans)) {
        plans.forEach(p => {
          total++
          if (p.completed) {
            completed++
            completedDates.push(p.plan_date)
          }
        })
      }
      const rate = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%'
      this.setData({ completedDates, stats: { total, completed, rate } })
      this.buildCalendar()
    } catch (e) {
      this.buildCalendar()
    }
  },

  buildCalendar() {
    const { year, month } = this.data
    const totalDays = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: '', status: '', isToday: false })
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        date: dateStr,
        status: this.data.completedDates.includes(dateStr) ? 'completed' : '',
        isToday: dateStr === this.data.today,
      })
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    this.setData({ weeks })
  },

  onPrevMonth() {
    let { year, month } = this.data
    month--
    if (month < 1) { month = 12; year-- }
    this.setData({ year, month })
    this.loadMonthData()
  },

  onNextMonth() {
    let { year, month } = this.data
    month++
    if (month > 12) { month = 1; year++ }
    this.setData({ year, month })
    this.loadMonthData()
  },
})