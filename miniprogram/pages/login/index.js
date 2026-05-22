var httpModule = require('../../utils/request')
var http = httpModule.http
var { API } = require('../../utils/constants')

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
  },

  onWechatLogin: function() {
    wx.login({
      success: function(res) {
        if (!res.code) {
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }
        wx.showLoading({ title: '登录中...' })
        http.wechatLogin(res.code).then(function(data) {
          wx.hideLoading()
          http.setToken(data.access_token)
          wx.switchTab({ url: '/pages/index/index' })
        }).catch(function(err) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
        })
      },
      fail: function() {
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  onAccountLogin: function() {
    var that = this
    var username = that.data.username
    var password = that.data.password
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    wx.showLoading({ title: '登录中...' })
    http.login(username, password).then(function(data) {
      wx.hideLoading()
      http.setToken(data.access_token)
      wx.switchTab({ url: '/pages/index/index' })
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '登录失败', icon: 'none' })
    })
  },

  onRegister: function() {
    var that = this
    var username = that.data.username
    var password = that.data.password
    var confirmPassword = that.data.confirmPassword
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    wx.showLoading({ title: '注册中...' })
    http.register(username, password).then(function() {
      return http.login(username, password)
    }).then(function(data) {
      wx.hideLoading()
      http.setToken(data.access_token)
      wx.switchTab({ url: '/pages/index/index' })
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '注册失败', icon: 'none' })
    })
  },

  onToggleMode: function() {
    this.setData({ isRegister: !this.data.isRegister })
  },

  onUsernameInput: function(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput: function(e) {
    this.setData({ password: e.detail.value })
  },

  onConfirmPasswordInput: function(e) {
    this.setData({ confirmPassword: e.detail.value })
  },
})