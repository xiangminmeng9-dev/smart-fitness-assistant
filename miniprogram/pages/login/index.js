var { getBaseUrl, API } = require('../../utils/constants')

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
    debugMsg: '',
  },

  onWechatLogin: function() {
    var that = this
    that.setData({ debugMsg: '正在获取微信code...' })
    wx.login({
      success: function(res) {
        if (!res.code) {
          that.setData({ debugMsg: '微信login返回空code' })
          return
        }
        that.setData({ debugMsg: '获取code成功，请求服务器...' })
        var baseUrl = getBaseUrl()
        wx.request({
          url: baseUrl + API.AUTH_WECHAT_LOGIN,
          method: 'POST',
          data: { code: res.code },
          header: { 'Content-Type': 'application/json' },
          success: function(resp) {
            if (resp.statusCode >= 200 && resp.statusCode < 300 && resp.data && resp.data.access_token) {
              wx.setStorageSync('token', resp.data.access_token)
              that.setData({ debugMsg: '微信登录成功!' })
              wx.switchTab({ url: '/pages/index/index' })
            } else {
              var msg = '登录失败(' + resp.statusCode + '): ' + JSON.stringify(resp.data).substring(0, 200)
              that.setData({ debugMsg: msg })
            }
          },
          fail: function(err) {
            that.setData({ debugMsg: '请求失败: ' + (err.errMsg || 'unknown') })
          }
        })
      },
      fail: function(err) {
        that.setData({ debugMsg: 'wx.login失败: ' + (err.errMsg || 'unknown') })
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
    that.setData({ debugMsg: '正在登录...' })
    var baseUrl = getBaseUrl()
    wx.request({
      url: baseUrl + API.AUTH_LOGIN,
      method: 'POST',
      data: { username: username, password: password },
      header: { 'Content-Type': 'application/json' },
      success: function(resp) {
        if (resp.statusCode >= 200 && resp.statusCode < 300 && resp.data && resp.data.access_token) {
          wx.setStorageSync('token', resp.data.access_token)
          that.setData({ debugMsg: '登录成功!' })
          wx.switchTab({ url: '/pages/index/index' })
        } else {
          var msg = '登录失败(' + resp.statusCode + '): ' + JSON.stringify(resp.data).substring(0, 200)
          that.setData({ debugMsg: msg })
        }
      },
      fail: function(err) {
        that.setData({ debugMsg: '请求失败: ' + (err.errMsg || 'unknown') })
      }
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
    that.setData({ debugMsg: '正在注册...' })
    var baseUrl = getBaseUrl()
    wx.request({
      url: baseUrl + API.AUTH_REGISTER,
      method: 'POST',
      data: { username: username, password: password },
      header: { 'Content-Type': 'application/json' },
      success: function(resp) {
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          that.setData({ debugMsg: '注册成功，正在登录...' })
          wx.request({
            url: baseUrl + API.AUTH_LOGIN,
            method: 'POST',
            data: { username: username, password: password },
            header: { 'Content-Type': 'application/json' },
            success: function(resp2) {
              if (resp2.statusCode >= 200 && resp2.statusCode < 300 && resp2.data && resp2.data.access_token) {
                wx.setStorageSync('token', resp2.data.access_token)
                wx.switchTab({ url: '/pages/index/index' })
              } else {
                that.setData({ debugMsg: '登录失败: ' + JSON.stringify(resp2.data).substring(0, 200) })
              }
            },
            fail: function(err) {
              that.setData({ debugMsg: '登录请求失败: ' + (err.errMsg || 'unknown') })
            }
          })
        } else {
          var msg = '注册失败(' + resp.statusCode + '): ' + JSON.stringify(resp.data).substring(0, 200)
          that.setData({ debugMsg: msg })
        }
      },
      fail: function(err) {
        that.setData({ debugMsg: '请求失败: ' + (err.errMsg || 'unknown') })
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