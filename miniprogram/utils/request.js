var { getBaseUrl, API } = require('./constants')

var TOKEN_KEY = 'token'

function getToken() {
  try {
    var app = getApp()
    if (app && app.globalData && app.globalData.token) {
      return app.globalData.token
    }
  } catch (e) {}
  try {
    return wx.getStorageSync(TOKEN_KEY) || ''
  } catch (e) {
    return ''
  }
}

function setToken(token) {
  try {
    var app = getApp()
    if (app && app.globalData) {
      app.globalData.token = token
    }
  } catch (e) {}
  try {
    wx.setStorageSync(TOKEN_KEY, token)
  } catch (e) {}
}

function clearToken() {
  try {
    var app = getApp()
    if (app && app.globalData) {
      app.globalData.token = ''
    }
  } catch (e) {}
  try {
    wx.removeStorageSync(TOKEN_KEY)
  } catch (e) {}
}

function request(options) {
  var url = options.url
  var method = options.method || 'GET'
  var data = options.data
  var needAuth = options.needAuth !== false
  var baseUrl = getBaseUrl()
  var token = getToken()

  var fullUrl = baseUrl + url

  var header = {
    'Content-Type': 'application/json',
  }

  if (needAuth && token) {
    header['Authorization'] = 'Bearer ' + token
  }

  console.log('[REQUEST]', method, fullUrl)

  return new Promise(function(resolve, reject) {
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: function(res) {
        console.log('[RESPONSE]', res.statusCode, fullUrl)
        if (res.statusCode === 401) {
          clearToken()
          reject(new Error('登录已过期'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          var msg = '请求失败(' + res.statusCode + ')'
          if (res.data && res.data.detail) {
            msg = res.data.detail
          }
          reject(new Error(msg))
        }
      },
      fail: function(err) {
        console.error('[REQUEST FAIL]', fullUrl, err.errMsg)
        reject(new Error('网络请求失败: ' + (err.errMsg || '未知错误')))
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