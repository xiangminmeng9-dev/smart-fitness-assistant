Component({
  properties: {
    selected: { type: Array, value: [] },
  },

  data: {
    muscles: ['胸', '背', '肩', '腿', '手臂', '腹部', '核心', '有氧'],
  },

  methods: {
    onToggle(e: WechatMiniprogram.CustomEvent) {
      const { name } = e.currentTarget.dataset
      const selected = [...this.data.selected] as string[]
      const idx = selected.indexOf(name)
      if (idx > -1) {
        selected.splice(idx, 1)
      } else {
        selected.push(name)
      }
      this.setData({ selected })
      this.triggerEvent('change', { value: selected })
    },
  },
})
