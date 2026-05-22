var BASE_URL = 'https://smart-fitness-assistant.vercel.app'

Page({
  data: {
    providers: [{type:'claude',name:'Claude'},{type:'kimi',name:'Kimi'},{type:'glm',name:'GLM'},{type:'deepseek',name:'DeepSeek'},{type:'custom',name:'自定义'}],
    selectedProvider: 'claude', baseUrl: '', apiKey: '', modelName: '', testResult: null,
  },

  onLoad: function() { this.loadConfig() },

  loadConfig: function() {
    var that = this, token = wx.getStorageSync('token')
    wx.request({
      url: BASE_URL + '/api/model-config/',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if(res.statusCode===200 && res.data) {
          that.setData({ selectedProvider:res.data.provider_type||'claude', baseUrl:res.data.base_url||'', modelName:res.data.model_name||'' })
        }
      },
      fail: function() {}
    })
  },

  onProviderTap: function(e) {
    var type=e.currentTarget.dataset.type
    var defaults={claude:{b:'https://api.anthropic.com',m:'claude-sonnet-4-6'},kimi:{b:'https://api.moonshot.cn',m:'moonshot-v1-8k'},glm:{b:'https://open.bigmodel.cn',m:'glm-4'},deepseek:{b:'https://api.deepseek.com',m:'deepseek-chat'},custom:{b:'',m:''}}
    var d=defaults[type]||defaults.custom
    this.setData({ selectedProvider:type, baseUrl:d.b, modelName:d.m })
  },

  onBaseUrlInput: function(e) { this.setData({baseUrl:e.detail.value}) },
  onApiKeyInput: function(e) { this.setData({apiKey:e.detail.value}) },
  onModelNameInput: function(e) { this.setData({modelName:e.detail.value}) },

  onTestConnection: function() {
    var that=this, token=wx.getStorageSync('token')
    wx.showLoading({title:'测试中...'})
    wx.request({
      url: BASE_URL+'/api/model-config/test',
      method:'POST',
      data:{provider_type:that.data.selectedProvider,base_url:that.data.baseUrl,api_key:that.data.apiKey,model_name:that.data.modelName},
      header:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      success:function(res){wx.hideLoading();that.setData({testResult:res.statusCode===200?res.data:{success:false,error:'测试失败'}});wx.showToast({title:res.statusCode===200&&res.data.success?'连接成功':'连接失败',icon:res.statusCode===200&&res.data&&res.data.success?'success':'none'})},
      fail:function(){wx.hideLoading();wx.showToast({title:'测试失败',icon:'none'})}
    })
  },

  onSave: function() {
    var that=this, token=wx.getStorageSync('token')
    wx.showLoading({title:'保存中...'})
    wx.request({
      url: BASE_URL+'/api/model-config/',
      method:'POST',
      data:{provider_type:that.data.selectedProvider,base_url:that.data.baseUrl,api_key:that.data.apiKey,model_name:that.data.modelName},
      header:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      success:function(res){wx.hideLoading();if(res.statusCode===200){wx.showToast({title:'保存成功',icon:'success'});setTimeout(function(){wx.navigateBack()},1500)}else wx.showToast({title:'保存失败',icon:'none'})},
      fail:function(){wx.hideLoading();wx.showToast({title:'保存失败',icon:'none'})}
    })
  },

  onDeleteConfig: function() {
    var that=this, token=wx.getStorageSync('token')
    wx.request({
      url: BASE_URL+'/api/model-config/',
      method:'DELETE',
      header:{'Authorization':'Bearer '+token},
      success:function(){that.setData({baseUrl:'',apiKey:'',modelName:'',selectedProvider:'claude'});wx.showToast({title:'已恢复默认',icon:'success'})},
      fail:function(){wx.showToast({title:'操作失败',icon:'none'})}
    })
  },
})