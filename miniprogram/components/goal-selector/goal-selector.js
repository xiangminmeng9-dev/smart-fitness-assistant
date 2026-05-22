Component({
  properties: {
    selected: { type: String, value: '减脂' },
  },

  data: {
    goals: [
      { value: '减脂', label: '减脂', icon: '🔥', desc: '燃烧脂肪' },
      { value: '增肌', label: '增肌', icon: '💪', desc: '增长肌肉' },
    ],
  },

  methods: {
    onSelect(e: WechatMiniprogram.CustomEvent) {
      const { value } = e.currentTarget.dataset
      this.setData({ selected: value })
      this.triggerEvent('change', { value })
    },
  },
})
