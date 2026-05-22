var httpModule = require('../../utils/request')
var http = httpModule.http
var { API } = require('../../utils/constants')

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

  onLoad: function() {
    this.loadConfig()
  },

  loadConfig: function() {
    var that = this
    http.get(API.MODEL_CONFIG).then(function(res) {
      that.setData({
        selectedProvider: res.provider_type || 'claude',
        baseUrl: res.base_url || '',
        modelName: res.model_name || '',
        apiKey: '',
      })
    }).catch(function() {})
  },

  onProviderTap: function(e) {
    var type = e.currentTarget.dataset.type
    var defaults = {
      claude: { base_url: 'https://api.anthropic.com', model: 'claude-sonnet-4-6' },
      kimi: { base_url: 'https://api.moonshot.cn', model: 'moonshot-v1-8k' },
      glm: { base_url: 'https://open.bigmodel.cn', model: 'glm-4' },
      deepseek: { base_url: 'https://api.deepseek.com', model: 'deepseek-chat' },
      custom: { base_url: '', model: '' },
    }
    var d = defaults[type] || defaults.custom
    this.setData({
      selectedProvider: type,
      baseUrl: d.base_url,
      modelName: d.model,
    })
  },

  onBaseUrlInput: function(e) { this.setData({ baseUrl: e.detail.value }) },
  onApiKeyInput: function(e) { this.setData({ apiKey: e.detail.value }) },
  onModelNameInput: function(e) { this.setData({ modelName: e.detail.value }) },

  onTestConnection: function() {
    var that = this
    wx.showLoading({ title: '测试中...' })
    http.post(API.MODEL_CONFIG_TEST, {
      provider_type: that.data.selectedProvider,
      base_url: that.data.baseUrl,
      api_key: that.data.apiKey,
      model_name: that.data.modelName,
    }).then(function(res) {
      wx.hideLoading()
      that.setData({ testResult: res })
      wx.showToast({ title: res.success ? '连接成功' : '连接失败', icon: res.success ? 'success' : 'none' })
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: '测试失败', icon: 'none' })
    })
  },

  onSave: function() {
    var that = this
    wx.showLoading({ title: '保存中...' })
    http.post(API.MODEL_CONFIG, {
      provider_type: that.data.selectedProvider,
      base_url: that.data.baseUrl,
      api_key: that.data.apiKey,
      model_name: that.data.modelName,
    }).then(function() {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(function() { wx.navigateBack() }, 1500)
    }).catch(function(err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    })
  },

  onDeleteConfig: function() {
    var that = this
    http.del(API.MODEL_CONFIG).then(function() {
      that.setData({ baseUrl: '', apiKey: '', modelName: '', selectedProvider: 'claude' })
      wx.showToast({ title: '已恢复默认', icon: 'success' })
    }).catch(function() {
      wx.showToast({ title: '操作失败', icon: 'none' })
    })
  },
})