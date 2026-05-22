Component({
  properties: {
    currentDay: { type: Number, value: 1 },
    totalDays: { type: Number, value: 28 },
    intensity: { type: String, value: 'medium' },
  },

  data: {
    progress: 0,
    intensityLabel: '中等强度',
  },

  observers: {
    'currentDay, totalDays, intensity': function (currentDay: number, totalDays: number, intensity: string) {
      const progress = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0
      const intensityMap: Record<string, string> = {
        light: '低强度',
        medium: '中等强度',
        heavy: '高强度',
        deload: '减载周',
      }
      this.setData({
        progress,
        intensityLabel: intensityMap[intensity] || intensity,
      })
    },
  },
})
