var { http } = require('./request')

function isLoggedIn() {
  return !!http.getToken()
}

function wechatLogin() {
  return wx.login().then(function(res) {
    return http.wechatLogin(res.code)
  }).then(function(res) {
    http.setToken(res.access_token)
  })
}

function accountLogin(username, password) {
  return http.login(username, password).then(function(res) {
    http.setToken(res.access_token)
  })
}

function accountRegister(username, password) {
  return http.register(username, password).then(function() {
    return http.login(username, password)
  }).then(function(res) {
    http.setToken(res.access_token)
  })
}

function logout() {
  http.clearToken()
  wx.reLaunch({ url: '/pages/login/index' })
}

function requireAuth() {
  if (!isLoggedIn()) {
    wx.reLaunch({ url: '/pages/login/index' })
  }
}

module.exports = {
  isLoggedIn,
  wechatLogin,
  accountLogin,
  accountRegister,
  logout,
  requireAuth,
}