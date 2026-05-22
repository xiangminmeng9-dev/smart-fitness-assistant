import { http } from './request'

export function isLoggedIn(): boolean {
  return !!http.getToken()
}

export async function wechatLogin(): Promise<void> {
  const { code } = await wx.login()
  const res = await http.wechatLogin(code)
  http.setToken(res.access_token)
}

export async function accountLogin(username: string, password: string): Promise<void> {
  const res = await http.login(username, password)
  http.setToken(res.access_token)
}

export async function accountRegister(username: string, password: string): Promise<void> {
  await http.register(username, password)
  // Auto login after register
  const res = await http.login(username, password)
  http.setToken(res.access_token)
}

export function logout(): void {
  http.clearToken()
  wx.reLaunch({ url: '/pages/login/index' })
}

export function requireAuth(): void {
  if (!isLoggedIn()) {
    wx.reLaunch({ url: '/pages/login/index' })
  }
}
