const BASE_URL_KEY = 'api_base_url'

export function getBaseUrl(): string {
  const app = getApp<IAppOption>()
  return app.globalData.baseUrl
}

export function setBaseUrl(url: string): void {
  wx.setStorageSync(BASE_URL_KEY, url)
}

// API paths
export const API = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_WECHAT_LOGIN: '/api/auth/wechat-login',
  USER_PROFILE: '/api/user/profile',
  PLAN_LIST: '/api/plan/',
  PLAN_BY_DATE: (date: string) => `/api/plan/${date}`,
  PLAN_GENERATE: '/api/plan/generate',
  PLAN_COMPLETE: (id: number) => `/api/plan/${id}/complete`,
  PLAN_EXERCISE_COMPLETE: (id: number) => `/api/plan/${id}/exercise-complete`,
  SYSTEM_WEATHER: '/api/system/weather',
  SYSTEM_MOTIVATION: '/api/system/motivation',
  SYSTEM_TIPS: '/api/system/tips',
  MODEL_CONFIG: '/api/model-config/',
  MODEL_CONFIG_TEST: '/api/model-config/test',
  MODEL_CONFIG_PROVIDERS: '/api/model-config/providers',
}

// Muscle groups
export const MUSCLE_GROUPS = ['胸', '背', '肩', '腿', '手臂', '腹部', '核心', '有氧']

// Fitness goals
export const FITNESS_GOALS = [
  { value: '减脂' as const, label: '减脂', icon: '🔥', desc: '燃烧脂肪' },
  { value: '增肌' as const, label: '增肌', icon: '💪', desc: '增长肌肉' },
]

// Meal types
export const MEAL_TYPES = [
  { key: 'self_cook', label: '自己做' },
  { key: 'takeout', label: '点外卖' },
  { key: 'eat_out', label: '店里吃' },
] as const

// Meal names
export const MEAL_NAMES = [
  { key: 'breakfast', label: '早餐', time: '07:30' },
  { key: 'lunch', label: '午餐', time: '12:00' },
  { key: 'dinner', label: '晚餐', time: '18:30' },
] as const

// Tip categories
export const TIP_CATEGORIES = [
  { key: '训练技巧', icon: '🏋️', desc: '掌握正确姿势，提升训练效果' },
  { key: '饮食营养', icon: '🥗', desc: '科学搭配，吃出好身材' },
  { key: '休息恢复', icon: '😴', desc: '充分休息，让肌肉更好生长' },
  { key: '心理建设', icon: '🧠', desc: '坚持就是胜利' },
]

// Intensity labels
export const INTENSITY_MAP: Record<string, string> = {
  light: '低强度',
  medium: '中等强度',
  heavy: '高强度',
  deload: '减载周',
}
