/**
 * 公共工具函数
 */

/**
 * 格式化日期为中文格式
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

/**
 * 格式化短日期
 */
export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * 计算 BMI
 */
export const calculateBMI = (height: number, weight: number): number => {
  if (height <= 0 || weight <= 0) return 0;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * 获取 BMI 状态描述
 */
export const getBMIStatus = (bmi: number): { status: string; color: string } => {
  if (bmi < 18.5) return { status: '偏瘦', color: 'text-blue-500' };
  if (bmi < 24) return { status: '正常', color: 'text-green-500' };
  if (bmi < 28) return { status: '偏胖', color: 'text-yellow-500' };
  return { status: '肥胖', color: 'text-red-500' };
};

/**
 * 格式化数字，保留指定小数位
 */
export const formatNumber = (num: number, decimals: number = 1): string => {
  return num.toFixed(decimals);
};

/**
 * 获取星期几的中文名称
 */
export const getWeekdayName = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[d.getDay()];
};

/**
 * 判断是否是今天
 */
export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * 获取日期字符串 (YYYY-MM-DD)
 */
export const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 添加天数
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 防抖函数
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}
