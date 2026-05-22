function formatDate(date) {
  var y = date.getFullYear()
  var m = String(date.getMonth() + 1).padStart(2, '0')
  var d = String(date.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

function formatDateCN(date) {
  var m = date.getMonth() + 1
  var d = date.getDate()
  var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return m + '月' + d + '日 ' + weekdays[date.getDay()]
}

function formatCalories(cal) {
  if (cal >= 1000) {
    return (cal / 1000).toFixed(1) + 'k'
  }
  return String(Math.round(cal))
}

function formatWeight(weight) {
  return weight % 1 === 0 ? String(weight) : weight.toFixed(1)
}

function getDaysAgo(days) {
  var d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function getDaysLater(days) {
  var d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function getMonthDays(year, month) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

module.exports = {
  formatDate,
  formatDateCN,
  formatCalories,
  formatWeight,
  getDaysAgo,
  getDaysLater,
  getMonthDays,
  getFirstDayOfWeek,
}