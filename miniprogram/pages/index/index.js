const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')
const { formatDate, formatDateCN } = require('../../utils/formatters')

Page({
  data: {
    currentDate: '',
    dateDisplay: '',
    plan: null,
    weather: null,
    motivation: '坚持就是胜利',
    loading: true,
    hasPlan: false,
    loggedIn: false,
  },

  onLoad() {
    const now = new Date()
    this.setData({
      currentDate: formatDate(now),
      dateDisplay: formatDateCN(now),
    })
  },

  onShow() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.setData({ loggedIn: false, loading: false })
      return
    }
    this.setData({ loggedIn: true })
    this.loadAllData()
  },

  async loadAllData() {
    this.setData({ loading: true })
    try {
      const results = await Promise.allSettled([
        http.get(API.PLAN_BY_DATE(this.data.currentDate)),
        http.get(API.SYSTEM_WEATHER),
        http.get(API.SYSTEM_MOTIVATION),
      ])

      const plan = results[0].status === 'fulfilled' ? results[0].value : null
      const weather = results[1].status === 'fulfilled' ? results[1].value : null
      const motivation = results[2].status === 'fulfilled' ? results[2].value : null

      this.setData({
        plan,
        weather: weather || null,
        motivation: motivation?.quote || '坚持就是胜利',
        hasPlan: !!plan && !!plan.plan_data,
        loading: false,
      })
    } catch (err) {
      console.error('loadAllData error', err)
      this.setData({ loading: false, hasPlan: false })
    }
  },

  onPrevDay() {
    const d = new Date(this.data.currentDate)
    d.setDate(d.getDate() - 1)
    this.setData({
      currentDate: formatDate(d),
      dateDisplay: formatDateCN(d),
    })
    this.loadAllData()
  },

  onNextDay() {
    const d = new Date(this.data.currentDate)
    d.setDate(d.getDate() + 1)
    this.setData({
      currentDate: formatDate(d),
      dateDisplay: formatDateCN(d),
    })
    this.loadAllData()
  },

  async onGeneratePlan() {
    try {
      wx.showLoading({ title: '生成计划中...' })
      const plan = await http.post(API.PLAN_GENERATE, { plan_date: this.data.currentDate })
      this.setData({ plan, hasPlan: true })
      wx.hideLoading()
      wx.showToast({ title: '计划已生成', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '生成失败', icon: 'none' })
    }
  },

  async onToggleComplete() {
    if (!this.data.plan) return
    try {
      await http.put(API.PLAN_COMPLETE(this.data.plan.id))
      const plan = { ...this.data.plan, completed: !this.data.plan.completed }
      this.setData({ plan })
      wx.vibrateShort({ type: 'light' })
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  async onToggleExercise(e) {
    const { groupindex, exerciseindex } = e.currentTarget.dataset
    const plan = JSON.parse(JSON.stringify(this.data.plan))
    const exercise = plan.plan_data.workout_groups[groupindex].exercises[exerciseindex]
    try {
      await http.put(API.PLAN_EXERCISE_COMPLETE(plan.id), {
        group_index: groupindex,
        exercise_index: exerciseindex,
      })
      exercise.completed = !exercise.completed
      this.setData({ plan })
      wx.vibrateShort({ type: 'light' })
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' })
    }
  },

  onViewFullPlan() {
    wx.navigateTo({
      url: `/pages/plan-detail/index?date=${this.data.currentDate}`,
    })
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onShareAppMessage() {
    return {
      title: '智能健身助手 - AI驱动的个性化健身计划',
      path: '/pages/index/index',
    }
  },
})