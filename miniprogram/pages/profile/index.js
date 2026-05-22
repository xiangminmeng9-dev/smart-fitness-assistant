var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

Page({
  data: {
    goal: '减脂', selectedMuscles: [], age: '', gender: 'male',
    height: '', weight: '', targetWeight: '', frequency: '3', cycleDays: '28',
    muscles: ['胸','背','肩','腿','手臂','腹部','核心','有氧'],
  },

  onLoad: function() { this.loadProfile() },

  loadProfile: function() {
    var that = this
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/user/profile',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode===200 && res.data) {
          var d = res.data
          that.setData({
            goal: d.fitness_goal||'减脂', selectedMuscles: d.selected_muscle_groups||[],
            age: String(d.age||''), gender: d.gender||'male',
            height: String(d.height||''), weight: String(d.weight||''),
            targetWeight: String(d.target_weight||''), frequency: String(d.fitness_frequency||3),
            cycleDays: String(d.training_cycle_days||28),
          })
        }
      },
      fail: function() {}
    })
  },

  onGoalFat: function() { this.setData({ goal:'减脂' }) },
  onGoalMuscle: function() { this.setData({ goal:'增肌' }) },
  onToggleMuscle: function(e) {
    var name=e.currentTarget.dataset.name, sel=this.data.selectedMuscles.slice(), idx=sel.indexOf(name)
    if(idx>-1) sel.splice(idx,1); else sel.push(name)
    this.setData({ selectedMuscles: sel })
  },
  onGenderMale: function() { this.setData({ gender:'male' }) },
  onGenderFemale: function() { this.setData({ gender:'female' }) },
  onAgeInput: function(e) { this.setData({ age:e.detail.value }) },
  onHeightInput: function(e) { this.setData({ height:e.detail.value }) },
  onWeightInput: function(e) { this.setData({ weight:e.detail.value }) },
  onTargetWeightInput: function(e) { this.setData({ targetWeight:e.detail.value }) },
  onFrequencyInput: function(e) { this.setData({ frequency:e.detail.value }) },
  onCycleDaysInput: function(e) { this.setData({ cycleDays:e.detail.value }) },
  onGetLocation: function() {
    var that = this
    wx.getLocation({ type:'gcj02',
      success: function() { wx.showToast({title:'定位成功',icon:'success'}) },
      fail: function() { wx.showToast({title:'定位失败',icon:'none'}) }
    })
  },
  onSave: function() {
    var that = this, d = that.data
    if(!d.age||!d.height||!d.weight) { wx.showToast({title:'请填写基本信息',icon:'none'}); return }
    wx.showLoading({title:'保存中...'})
    var token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/user/profile',
      method: 'POST',
      data: {
        fitness_goal:d.goal, selected_muscle_groups:d.selectedMuscles,
        age:parseInt(d.age), gender:d.gender, height:parseFloat(d.height),
        weight:parseFloat(d.weight), target_weight:parseFloat(d.targetWeight)||parseFloat(d.weight),
        fitness_frequency:parseInt(d.frequency)||3, training_cycle_days:parseInt(d.cycleDays)||28,
      },
      header: { 'Authorization':'Bearer '+token, 'Content-Type':'application/json' },
      success: function(res) {
        wx.hideLoading()
        if(res.statusCode===200) { wx.showToast({title:'保存成功',icon:'success'}); setTimeout(function(){wx.navigateBack()},1500) }
        else wx.showToast({title:'保存失败',icon:'none'})
      },
      fail: function() { wx.hideLoading(); wx.showToast({title:'保存失败',icon:'none'}) }
    })
  },
})