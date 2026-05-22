var httpModule = require('../../utils/request')
var http = httpModule.http
var { API } = require('../../utils/constants')

Page({
  data: {
    goal: '减脂',
    selectedMuscles: [],
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    targetWeight: '',
    frequency: '3',
    cycleDays: '28',
    muscles: ['胸', '背', '肩', '腿', '手臂', '腹部', '核心', '有氧'],
  },

  onLoad: function() {
    this.loadProfile()
  },

  loadProfile: function() {
    var that = this
    http.get(API.USER_PROFILE).then(function(res) {
      that.setData({
        goal: res.fitness_goal || '减脂',
        selectedMuscles: res.selected_muscle_groups || [],
        age: String(res.age || ''),
        gender: res.gender || 'male',
        height: String(res.height || ''),
        weight: String(res.weight || ''),
        targetWeight: String(res.target_weight || ''),
        frequency: String(res.fitness_frequency || 3),
        cycleDays: String(res.training_cycle_days || 28),
      })
    }).catch(function() {})
  },

  onGoalFat: function() { this.setData({ goal: '减脂' }) },
  onGoalMuscle: function() { this.setData({ goal: '增肌' }) },

  onToggleMuscle: function(e) {
    var name = e.currentTarget.dataset.name
    var selected = this.data.selectedMuscles.slice()
    var idx = selected.indexOf(name)
    if (idx > -1) {
      selected.splice(idx, 1)
    } else {
      selected.push(name)
    }
    this.setData({ selectedMuscles: selected })
  },

  onGenderMale: function() { this.setData({ gender: 'male' }) },
  onGenderFemale: function() { this.setData({ gender: 'female' }) },

  onAgeInput: function(e) { this.setData({ age: e.detail.value }) },
  onHeightInput: function(e) { this.setData({ height: e.detail.value }) },
  onWeightInput: function(e) { this.setData({ weight: e.detail.value }) },
  onTargetWeightInput: function(e) { this.setData({ targetWeight: e.detail.value }) },
  onFrequencyInput: function(e) { this.setData({ frequency: e.detail.value }) },
  onCycleDaysInput: function(e) { this.setData({ cycleDays: e.detail.value }) },

  onGetLocation: function() {
    var that = this
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        that.setData({ location: { lat: res.latitude, lng: res.longitude } })
        wx.showToast({ title: '定位成功', icon: 'success' })
      },
      fail: function() {
        wx.showToast({ title: '定位失败', icon: 'none' })
      }
    })
  },

  onSave: function() {
    var that = this
    var data = that.data
    if (!data.age || !data.height || !data.weight) {
      wx.showToast({ title: '请填写基本信息', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    http.post(API.USER_PROFILE, {
      fitness_goal: data.goal,
      selected_muscle_groups: data.selectedMuscles,
      age: parseInt(data.age),
      gender: data.gender,
      height: parseFloat(data.height),
      weight: parseFloat(data.weight),
      target_weight: parseFloat(data.targetWeight) || parseFloat(data.weight),
      fitness_frequency: parseInt(data.frequency) || 3,
      training_cycle_days: parseInt(data.cycleDays) || 28,
    }).then(function() {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(function() { wx.navigateBack() }, 1500)
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },
})