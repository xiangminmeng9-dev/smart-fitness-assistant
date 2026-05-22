var DEFAULT_BASE_URL = 'https://smart-fitness-assistant.vercel.app'

function getBaseUrl() {
  try {
    var app = getApp()
    if (app && app.globalData && app.globalData.baseUrl) {
      return app.globalData.baseUrl
    }
  } catch (e) {}
  return DEFAULT_BASE_URL
}

var API = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_WECHAT_LOGIN: '/api/auth/wechat-login',
  USER_PROFILE: '/api/user/profile',
  PLAN_LIST: '/api/plan/',
  PLAN_BY_DATE: function(date) { return '/api/plan/' + date },
  PLAN_GENERATE: '/api/plan/generate',
  PLAN_COMPLETE: function(id) { return '/api/plan/' + id + '/complete' },
  PLAN_EXERCISE_COMPLETE: function(id) { return '/api/plan/' + id + '/exercise-complete' },
  SYSTEM_WEATHER: '/api/system/weather',
  SYSTEM_MOTIVATION: '/api/system/motivation',
  SYSTEM_TIPS: '/api/system/tips',
  MODEL_CONFIG: '/api/model-config/',
  MODEL_CONFIG_TEST: '/api/model-config/test',
  MODEL_CONFIG_PROVIDERS: '/api/model-config/providers',
}

var MUSCLE_GROUPS = ['胸', '背', '肩', '腿', '手臂', '腹部', '核心', '有氧']

var FITNESS_GOALS = [
  { value: '减脂', label: '减脂', icon: '🔥', desc: '燃烧脂肪' },
  { value: '增肌', label: '增肌', icon: '💪', desc: '增长肌肉' },
]

var MEAL_TYPES = [
  { key: 'self_cook', label: '自己做' },
  { key: 'takeout', label: '点外卖' },
  { key: 'eat_out', label: '店里吃' },
]

var MEAL_NAMES = [
  { key: 'breakfast', label: '早餐', time: '07:30' },
  { key: 'lunch', label: '午餐', time: '12:00' },
  { key: 'dinner', label: '晚餐', time: '18:30' },
]

var TIP_CATEGORIES = [
  { key: '训练技巧', icon: '🏋️', desc: '掌握正确姿势，提升训练效果' },
  { key: '饮食营养', icon: '🥗', desc: '科学搭配，吃出好身材' },
  { key: '休息恢复', icon: '😴', desc: '充分休息，让肌肉更好生长' },
  { key: '心理建设', icon: '🧠', desc: '坚持就是胜利' },
]

var INTENSITY_MAP = {
  light: '低强度',
  medium: '中等强度',
  heavy: '高强度',
  deload: '减载周',
}

module.exports = {
  getBaseUrl: getBaseUrl,
  DEFAULT_BASE_URL: DEFAULT_BASE_URL,
  API: API,
  MUSCLE_GROUPS: MUSCLE_GROUPS,
  FITNESS_GOALS: FITNESS_GOALS,
  MEAL_TYPES: MEAL_TYPES,
  MEAL_NAMES: MEAL_NAMES,
  TIP_CATEGORIES: TIP_CATEGORIES,
  INTENSITY_MAP: INTENSITY_MAP,
}