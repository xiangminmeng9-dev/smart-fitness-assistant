import { API, getBaseUrl } from './constants'
import type { LoginResponse } from './types'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

interface ApiResponse<T = any> {
  data: T
  statusCode: number
}

function getToken(): string {
  const app = getApp<IAppOption>()
  return app.globalData.token || wx.getStorageSync('token') || ''
}

function setToken(token: string): void {
  const app = getApp<IAppOption>()
  app.globalData.token = token
  wx.setStorageSync('token', token)
}

function clearToken(): void {
  const app = getApp<IAppOption>()
  app.globalData.token = ''
  wx.removeStorageSync('token')
}

function request<T = any>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, needAuth = true } = options
  const baseUrl = getBaseUrl()
  const token = getToken()

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (needAuth && token) {
    header['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode === 401) {
          clearToken()
          wx.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期，请重新登录'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          const msg = (res.data as any)?.detail || '请求失败'
          reject(new Error(msg))
        }
      },
      fail(err) {
        reject(new Error('网络错误，请检查网络连接'))
      },
    })
  })
}

// Auth
function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>({
    url: API.AUTH_LOGIN,
    method: 'POST',
    data: { username, password },
    needAuth: false,
  })
}

function wechatLogin(code: string): Promise<LoginResponse> {
  return request<LoginResponse>({
    url: API.AUTH_WECHAT_LOGIN,
    method: 'POST',
    data: { code },
    needAuth: false,
  })
}

function register(username: string, password: string): Promise<any> {
  return request({
    url: API.AUTH_REGISTER,
    method: 'POST',
    data: { username, password },
    needAuth: false,
  })
}

// Generic helpers
function get<T = any>(url: string): Promise<T> {
  return request<T>({ url })
}

function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'POST', data })
}

function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'PUT', data })
}

function del<T = any>(url: string): Promise<T> {
  return request<T>({ url, method: 'DELETE' })
}

export const http = {
  get,
  post,
  put,
  del,
  login,
  wechatLogin,
  register,
  setToken,
  clearToken,
  getToken,
}
