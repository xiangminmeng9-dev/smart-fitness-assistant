const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')

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

  onLoad() {
    this.loadProfile()
  },

  async loadProfile() {
    try {
      const profile = await http.get(API.USER_PROFILE)
      this.setData({
        goal: profile.fitness_goal || '减脂',
        selectedMuscles: profile.selected_muscle_groups || [],
        age: String(profile.age || ''),
        gender: profile.gender || 'male',
        height: String(profile.height || ''),
        weight: String(profile.weight || ''),
        targetWeight: String(profile.target_weight || ''),
        frequency: String(profile.fitness_frequency || 3),
        cycleDays: String(profile.training_cycle_days || 28),
      })
    } catch (e) {
      console.error('loadProfile', e)
    }
  },

  onGoalFat() { this.setData({ goal: '减脂' }) },
  onGoalMuscle() { this.setData({ goal: '增肌' }) },

  onToggleMuscle(e) {
    const name = e.currentTarget.dataset.name
    const selected = [...this.data.selectedMuscles]
    const idx = selected.indexOf(name)
    if (idx > -1) {
      selected.splice(idx, 1)
    } else {
      selected.push(name)
    }
    this.setData({ selectedMuscles: selected })
  },

  onGenderMale() { this.setData({ gender: 'male' }) },
  onGenderFemale() { this.setData({ gender: 'female' }) },

  onAgeInput(e) { this.setData({ age: e.detail.value }) },
  onHeightInput(e) { this.setData({ height: e.detail.value }) },
  onWeightInput(e) { this.setData({ weight: e.detail.value }) },
  onTargetWeightInput(e) { this.setData({ targetWeight: e.detail.value }) },
  onFrequencyInput(e) { this.setData({ frequency: e.detail.value }) },
  onCycleDaysInput(e) { this.setData({ cycleDays: e.detail.value }) },

  async onGetLocation() {
    try {
      const res = await wx.getLocation({ type: 'gcj02' })
      this.setData({ location: { lat: res.latitude, lng: res.longitude } })
      wx.showToast({ title: '定位成功', icon: 'success' })
    } catch {
      wx.showToast({ title: '定位失败', icon: 'none' })
    }
  },

  async onSave() {
    const { goal, selectedMuscles, age, gender, height, weight, targetWeight, frequency, cycleDays } = this.data
    if (!age || !height || !weight) {
      wx.showToast({ title: '请填写基本信息', icon: 'none' })
      return
    }
    try {
      wx.showLoading({ title: '保存中...' })
      await http.post(API.USER_PROFILE, {
        fitness_goal: goal,
        selected_muscle_groups: selectedMuscles,
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        target_weight: parseFloat(targetWeight) || parseFloat(weight),
        fitness_frequency: parseInt(frequency) || 3,
        training_cycle_days: parseInt(cycleDays) || 28,
      })
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },
})