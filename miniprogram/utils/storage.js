var TOKEN_KEY = 'token'
var PROFILE_KEY = 'user_profile'

function setStorage(key, value) {
  try {
    wx.setStorageSync(key, JSON.stringify(value))
  } catch (e) {
    // ignore
  }
}

function getStorage(key) {
  try {
    var raw = wx.getStorageSync(key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function removeStorage(key) {
  wx.removeStorageSync(key)
}

function cacheProfile(profile) {
  setStorage(PROFILE_KEY, profile)
}

function getCachedProfile() {
  return getStorage(PROFILE_KEY)
}

module.exports = {
  setStorage,
  getStorage,
  removeStorage,
  cacheProfile,
  getCachedProfile,
}