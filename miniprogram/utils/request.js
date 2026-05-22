var { getBaseUrl } = require('./constants')
var { API } = require('./constants')

function getToken() {
  var app = getApp()
  return app.globalData.token || wx.getStorageSync('token') || ''
}

function setToken(token) {
  var app = getApp()
  app.globalData.token = token
  wx.setStorageSync('token', token)
}

function clearToken() {
  var app = getApp()
  app.globalData.token = ''
  wx.removeStorageSync('token')
}

function request(options) {
  var url = options.url
  var method = options.method || 'GET'
  var data = options.data
  var needAuth = options.needAuth !== false
  var baseUrl = getBaseUrl()
  var token = getToken()

  var header = {
    'Content-Type': 'application/json',
  }

  if (needAuth && token) {
    header['Authorization'] = 'Bearer ' + token
  }

  return new Promise(function(resolve, reject) {
    wx.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: header,
      success: function(res) {
        if (res.statusCode === 401) {
          clearToken()
          wx.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期，请重新登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          var msg = (res.data && res.data.detail) || '请求失败'
          reject(new Error(msg))
        }
      },
      fail: function(err) {
        reject(new Error('网络错误，请检查网络连接'))
      },
    })
  })
}

function login(username, password) {
  return request({
    url: API.AUTH_LOGIN,
    method: 'POST',
    data: { username: username, password: password },
    needAuth: false,
  })
}

function wechatLogin(code) {
  return request({
    url: API.AUTH_WECHAT_LOGIN,
    method: 'POST',
    data: { code: code },
    needAuth: false,
  })
}

function register(username, password) {
  return request({
    url: API.AUTH_REGISTER,
    method: 'POST',
    data: { username: username, password: password },
    needAuth: false,
  })
}

function get(url) {
  return request({ url: url })
}

function post(url, data) {
  return request({ url: url, method: 'POST', data: data })
}

function put(url, data) {
  return request({ url: url, method: 'PUT', data: data })
}

function del(url) {
  return request({ url: url, method: 'DELETE' })
}

module.exports = {
  http: {
    get: get,
    post: post,
    put: put,
    del: del,
    login: login,
    wechatLogin: wechatLogin,
    register: register,
    setToken: setToken,
    clearToken: clearToken,
    getToken: getToken,
  },
}