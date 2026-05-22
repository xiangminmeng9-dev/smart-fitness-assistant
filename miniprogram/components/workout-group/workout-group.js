Component({
  properties: {
    muscleGroup: { type: String, value: '' },
    exercises: { type: Array, value: [] },
  },

  methods: {
    onExerciseTap(e: WechatMiniprogram.CustomEvent) {
      const { index } = e.currentTarget.dataset
      this.triggerEvent('exercisetap', { index })
    },
  },
})
