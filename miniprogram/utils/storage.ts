const TOKEN_KEY = 'token'
const PROFILE_KEY = 'user_profile'

export function setStorage(key: string, value: any): void {
  try {
    wx.setStorageSync(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function getStorage<T = any>(key: string): T | null {
  try {
    const raw = wx.getStorageSync(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function removeStorage(key: string): void {
  wx.removeStorageSync(key)
}

export function cacheProfile(profile: any): void {
  setStorage(PROFILE_KEY, profile)
}

export function getCachedProfile(): any | null {
  return getStorage(PROFILE_KEY)
}
