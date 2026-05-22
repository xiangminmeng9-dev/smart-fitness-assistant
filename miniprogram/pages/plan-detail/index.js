var httpModule = require('../../utils/request')
var http = httpModule.http
var { API } = require('../../utils/constants')

Page({
  data: {
    plan: null,
    date: '',
    loading: true,
  },

  onLoad: function(options) {
    if (options.date) {
      this.setData({ date: options.date })
      this.loadPlan(options.date)
    }
  },

  loadPlan: function(date) {
    var that = this
    http.get(API.PLAN_BY_DATE(date)).then(function(res) {
      that.setData({ plan: res, loading: false })
    }).catch(function() {
      that.setData({ loading: false })
    })
  },
})