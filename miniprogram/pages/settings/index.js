const { http } = require('../../utils/request')
const { API } = require('../../utils/constants')

Page({
  data: {
    providers: [
      { type: 'claude', name: 'Claude' },
      { type: 'kimi', name: 'Kimi' },
      { type: 'glm', name: 'GLM' },
      { type: 'deepseek', name: 'DeepSeek' },
      { type: 'custom', name: '自定义' },
    ],
    selectedProvider: 'claude',
    baseUrl: '',
    apiKey: '',
    modelName: '',
    testResult: null,
  },

  onLoad() {
    this.loadConfig()
  },

  async loadConfig() {
    try {
      const config = await http.get(API.MODEL_CONFIG)
      this.setData({
        selectedProvider: config.provider_type || 'claude',
        baseUrl: config.base_url || '',
        modelName: config.model_name || '',
        apiKey: '',
      })
    } catch (e) {
      console.error('loadConfig', e)
    }
  },

  onProviderTap(e) {
    const type = e.currentTarget.dataset.type
    const defaults = {
      claude: { base_url: 'https://api.anthropic.com', model: 'claude-sonnet-4-6' },
      kimi: { base_url: 'https://api.moonshot.cn', model: 'moonshot-v1-8k' },
      glm: { base_url: 'https://open.bigmodel.cn', model: 'glm-4' },
      deepseek: { base_url: 'https://api.deepseek.com', model: 'deepseek-chat' },
      custom: { base_url: '', model: '' },
    }
    const d = defaults[type] || defaults.custom
    this.setData({
      selectedProvider: type,
      baseUrl: d.base_url,
      modelName: d.model,
    })
  },

  onBaseUrlInput(e) { this.setData({ baseUrl: e.detail.value }) },
  onApiKeyInput(e) { this.setData({ apiKey: e.detail.value }) },
  onModelNameInput(e) { this.setData({ modelName: e.detail.value }) },

  async onTestConnection() {
    try {
      wx.showLoading({ title: '测试中...' })
      const res = await http.post(API.MODEL_CONFIG_TEST, {
        provider_type: this.data.selectedProvider,
        base_url: this.data.baseUrl,
        api_key: this.data.apiKey,
        model_name: this.data.modelName,
      })
      wx.hideLoading()
      this.setData({ testResult: res })
      wx.showToast({ title: res.success ? '连接成功' : '连接失败', icon: res.success ? 'success' : 'none' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '测试失败', icon: 'none' })
    }
  },

  async onSave() {
    try {
      wx.showLoading({ title: '保存中...' })
      await http.post(API.MODEL_CONFIG, {
        provider_type: this.data.selectedProvider,
        base_url: this.data.baseUrl,
        api_key: this.data.apiKey,
        model_name: this.data.modelName,
      })
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  },

  async onDeleteConfig() {
    try {
      await http.del(API.MODEL_CONFIG)
      this.setData({ baseUrl: '', apiKey: '', modelName: '', selectedProvider: 'claude' })
      wx.showToast({ title: '已恢复默认', icon: 'success' })
    } catch {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },
})