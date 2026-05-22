var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
    debugMsg: '页面已加载，等待操作...',
  },

  onWechatLogin: function() {
    var that = this
    that.setData({ debugMsg: '正在调用wx.login...' })
    wx.login({
      success: function(res) {
        that.setData({ debugMsg: 'wx.login成功, code=' + res.code })
        wx.request({
          url: BASE_URL + '/api/auth/wechat-login',
          method: 'POST',
          data: { code: res.code },
          header: { 'Content-Type': 'application/json' },
          success: function(resp) {
            that.setData({ debugMsg: '微信登录响应: ' + resp.statusCode + ' ' + JSON.stringify(resp.data).substring(0, 150) })
            if (resp.statusCode === 200 && resp.data && resp.data.access_token) {
              wx.setStorageSync('token', resp.data.access_token)
              wx.switchTab({ url: '/pages/index/index' })
            }
          },
          fail: function(err) {
            that.setData({ debugMsg: '微信登录请求失败: ' + err.errMsg })
          }
        })
      },
      fail: function(err) {
        that.setData({ debugMsg: 'wx.login失败: ' + err.errMsg })
      }
    })
  },

  onAccountLogin: function() {
    var that = this
    if (!that.data.username || !that.data.password) {
      that.setData({ debugMsg: '请输入用户名和密码' })
      return
    }
    that.setData({ debugMsg: '正在请求登录...' })
    wx.request({
      url: BASE_URL + '/api/auth/login',
      method: 'POST',
      data: { username: that.data.username, password: that.data.password },
      header: { 'Content-Type': 'application/json' },
      success: function(resp) {
        that.setData({ debugMsg: '登录响应: ' + resp.statusCode + ' ' + JSON.stringify(resp.data).substring(0, 150) })
        if (resp.statusCode === 200 && resp.data && resp.data.access_token) {
          wx.setStorageSync('token', resp.data.access_token)
          wx.switchTab({ url: '/pages/index/index' })
        }
      },
      fail: function(err) {
        that.setData({ debugMsg: '登录请求失败: ' + err.errMsg })
      }
    })
  },

  onRegister: function() {
    var that = this
    if (!that.data.username || !that.data.password) {
      that.setData({ debugMsg: '请输入用户名和密码' })
      return
    }
    if (that.data.password !== that.data.confirmPassword) {
      that.setData({ debugMsg: '两次密码不一致' })
      return
    }
    that.setData({ debugMsg: '正在注册...' })
    wx.request({
      url: BASE_URL + '/api/auth/register',
      method: 'POST',
      data: { username: that.data.username, password: that.data.password },
      header: { 'Content-Type': 'application/json' },
      success: function(resp) {
        if (resp.statusCode === 200) {
          that.setData({ debugMsg: '注册成功，自动登录...' })
          wx.request({
            url: BASE_URL + '/api/auth/login',
            method: 'POST',
            data: { username: that.data.username, password: that.data.password },
            header: { 'Content-Type': 'application/json' },
            success: function(resp2) {
              if (resp2.statusCode === 200 && resp2.data && resp2.data.access_token) {
                wx.setStorageSync('token', resp2.data.access_token)
                wx.switchTab({ url: '/pages/index/index' })
              } else {
                that.setData({ debugMsg: '自动登录失败: ' + resp2.statusCode })
              }
            },
            fail: function(err) {
              that.setData({ debugMsg: '自动登录请求失败: ' + err.errMsg })
            }
          })
        } else {
          that.setData({ debugMsg: '注册失败: ' + resp.statusCode + ' ' + JSON.stringify(resp.data).substring(0, 100) })
        }
      },
      fail: function(err) {
        that.setData({ debugMsg: '注册请求失败: ' + err.errMsg })
      }
    })
  },

  onToggleMode: function() {
    this.setData({ isRegister: !this.data.isRegister, debugMsg: '' })
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