export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDateCN(date: Date): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${m}月${d}日 ${weekdays[date.getDay()]}`
}

export function formatCalories(cal: number): string {
  if (cal >= 1000) {
    return `${(cal / 1000).toFixed(1)}k`
  }
  return String(Math.round(cal))
}

export function formatWeight(weight: number): string {
  return weight % 1 === 0 ? String(weight) : weight.toFixed(1)
}

export function getDaysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

export function getDaysLater(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

export function getMonthDays(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}
