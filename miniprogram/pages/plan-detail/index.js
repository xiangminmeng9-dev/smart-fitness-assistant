const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')

Page({
  data: {
    plan: null,
    date: '',
    loading: true,
  },

  onLoad(options) {
    if (options.date) {
      this.setData({ date: options.date })
      this.loadPlan(options.date)
    }
  },

  async loadPlan(date) {
    try {
      const plan = await http.get(API.PLAN_BY_DATE(date))
      this.setData({ plan, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },
})