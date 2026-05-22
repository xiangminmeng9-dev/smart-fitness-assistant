Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
  },

  async onWechatLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      const { code } = await wx.login()
      const { http } = require('../../utils/request')
      const res = await http.wechatLogin(code)
      http.setToken(res.access_token)
      wx.hideLoading()
      wx.switchTab({ url: '/pages/index/index' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '微信登录失败', icon: 'none' })
    }
  },

  async onAccountLogin() {
    const { username, password } = this.data
    if (!username.trim() || !password.trim()) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    try {
      wx.showLoading({ title: '登录中...' })
      const { http } = require('../../utils/request')
      const res = await http.login(username, password)
      http.setToken(res.access_token)
      wx.hideLoading()
      wx.switchTab({ url: '/pages/index/index' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    }
  },

  async onRegister() {
    const { username, password, confirmPassword } = this.data
    if (!username.trim() || !password.trim()) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    try {
      wx.showLoading({ title: '注册中...' })
      const { http } = require('../../utils/request')
      await http.register(username, password)
      const res = await http.login(username, password)
      http.setToken(res.access_token)
      wx.hideLoading()
      wx.switchTab({ url: '/pages/index/index' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
    }
  },

  onToggleMode() {
    this.setData({ isRegister: !this.data.isRegister })
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },
})