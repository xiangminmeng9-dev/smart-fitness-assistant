Component({
  properties: {
    mealKey: { type: String, value: 'breakfast' },
    mealLabel: { type: String, value: '早餐' },
    mealTime: { type: String, value: '07:30' },
    mealData: { type: Object, value: null },
  },

  data: {
    activeTab: 'self_cook' as string,
    tabs: [
      { key: 'self_cook', label: '自己做' },
      { key: 'takeout', label: '点外卖' },
      { key: 'eat_out', label: '店里吃' },
    ],
    expanded: false,
  },

  methods: {
    onTabChange(e: WechatMiniprogram.CustomEvent) {
      this.setData({ activeTab: e.currentTarget.dataset.key })
    },
    onToggleExpand() {
      this.setData({ expanded: !this.data.expanded })
    },
  },
})
