var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

Page({
  data: {
    isRegister: false,
    username: '',
    password: '',
    confirmPassword: '',
    debugMsg: '',
  },

  onLoad: function() {
    // 页面加载时测试API连通性
    this.testApiConnect()
  },

  testApiConnect: function() {
    var that = this
    that.setData({ debugMsg: '测试API连接...' })
    wx.request({
      url: BASE_URL + '/api/system/motivation',
      method: 'GET',
      success: function(res) {
        that.setData({ debugMsg: 'API连通! status=' + res.statusCode })
      },
      fail: function(err) {
        that.setData({ debugMsg: 'API不通: ' + err.errMsg })
      }
    })
  },

  onWechatLogin: function() {
    var that = this
    that.setData({ debugMsg: '调用wx.login...' })
    wx.login({
      success: function(res) {
        that.setData({ debugMsg: 'wx.login OK, code=' + res.code + ', 请求服务器...' })
        wx.request({
          url: BASE_URL + '/api/auth/wechat-login',
          method: 'POST',
          data: { code: res.code },
          header: { 'Content-Type': 'application/json' },
          success: function(resp) {
            that.setData({ debugMsg: '微信登录响应: status=' + resp.statusCode + ' body=' + JSON.stringify(resp.data).substring(0, 200) })
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
      that.setData({ debugMsg: '请先输入用户名和密码' })
      return
    }
    that.setData({ debugMsg: '请求登录 ' + BASE_URL + '/api/auth/login ...' })
    wx.request({
      url: BASE_URL + '/api/auth/login',
      method: 'POST',
      data: { username: that.data.username, password: that.data.password },
      header: { 'Content-Type': 'application/json' },
      success: function(resp) {
        that.setData({ debugMsg: '登录响应: status=' + resp.statusCode + ' body=' + JSON.stringify(resp.data).substring(0, 200) })
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
      that.setData({ debugMsg: '请先输入用户名和密码' })
      return
    }
    if (that.data.password !== that.data.confirmPassword) {
      that.setData({ debugMsg: '两次密码不一致' })
      return
    }
    that.setData({ debugMsg: '请求注册 ' + BASE_URL + '/api/auth/register ...' })
    wx.request({
      url: BASE_URL + '/api/auth/register',
      method: 'POST',
      data: { username: that.data.username, password: that.data.password },
      header: { 'Content-Type': 'application/json' },
      success: function(resp) {
        that.setData({ debugMsg: '注册响应: status=' + resp.statusCode + ' body=' + JSON.stringify(resp.data).substring(0, 200) })
        if (resp.statusCode === 200) {
          // 注册成功，自动登录
          that.setData({ debugMsg: '注册成功! 自动登录...' })
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
                that.setData({ debugMsg: '自动登录失败: status=' + resp2.statusCode })
              }
            },
            fail: function(err2) {
              that.setData({ debugMsg: '自动登录请求失败: ' + err2.errMsg })
            }
          })
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

  onUsernameInput: function(e) { this.setData({ username: e.detail.value }) },
  onPasswordInput: function(e) { this.setData({ password: e.detail.value }) },
  onConfirmPasswordInput: function(e) { this.setData({ confirmPassword: e.detail.value }) },
})