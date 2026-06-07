import { useEffect, useState } from 'react';
import { useModelConfigStore } from '../store/modelConfig';
import type { ModelConfig } from '../types/modelConfig';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const SettingsPage = () => {
  const {
    config, systemDefault,
    isLoading, isSaving, isTesting, testResult,
    fetchProviders, fetchConfig, saveConfig, deleteConfig, testConfig, clearTestResult
  } = useModelConfigStore();

  const [formData, setFormData] = useState<Partial<ModelConfig>>({
    provider_type: 'custom',
    base_url: '',
    api_key: '',
    model_name: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProviders();
    fetchConfig();
  }, [fetchProviders, fetchConfig]);

  useEffect(() => {
    if (config) {
      setFormData({
        provider_type: config.provider_type || 'custom',
        base_url: config.base_url || '',
        api_key: '', // Don't put the masked key in the input
        model_name: config.model_name || ''
      });
    }
  }, [config, systemDefault]);

  const handleSave = async () => {
    const dataToSave = { ...formData };
    // Ensure provider_type is set
    if (!dataToSave.provider_type) {
      dataToSave.provider_type = 'custom';
    }
    const success = await saveConfig(dataToSave);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setFormData({ ...formData, api_key: '' }); // Clear field after save
    }
  };

  const handleTest = async () => {
    await testConfig(formData);
  };

  const handleReset = async () => {
    if (window.confirm('确定要清除自定义设置并恢复系统默认吗？')) {
      await deleteConfig();
      clearTestResult();
      setSaveSuccess(false);
    }
  };

  if (isLoading && !config) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 模型设置</h1>
        <p className="mt-1 text-sm text-gray-500">
          配置为您生成健身计划的 AI 大模型。直接输入 API Key 和 URL 即可使用。
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">API 配置</h2>

          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700">API 格式 <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <select
                  value={formData.provider_type || 'custom'}
                  onChange={(e) => setFormData({ ...formData, provider_type: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="custom">OpenAI 兼容格式（推荐，适用于大部分中转站）</option>
                  <option value="claude">Anthropic 原生格式（仅官方API或支持的原生中转）</option>
                  <option value="kimi">Kimi (Moonshot)</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="glm">GLM (智谱清言)</option>
                  <option value="minimax">MiniMax</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">大多数中转站和第三方服务请选"OpenAI 兼容格式"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">API Base URL <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input
                  type="text"
                  value={formData.base_url || ''}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="例如: https://api.openai.com 或 https://your-proxy.com/v1"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">输入 API 服务地址，路径中的 /v1 会自动处理，无需手动去除</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">API Key <span className="text-red-500">*</span></label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder={config?.api_key_set ? `已设置 (尾号 ${config.api_key_hint || '****'}) - 输入新值覆盖` : "输入您的 API Key"}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.543-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">您的 API Key 将安全保存在服务器</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">模型名称 (Model Name)</label>
              <div className="mt-1">
                <input
                  type="text"
                  value={formData.model_name || ''}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="例如: gpt-4o, claude-3-opus, deepseek-chat"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">可选，留空则使用服务默认模型</p>
            </div>
          </div>

          {/* Test connection result area */}
          {testResult && (
            <div className={`mt-6 p-4 rounded-md ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {testResult.success ?
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" /> :
                    <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  }
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? '连接测试成功！' : '连接测试失败'}
                  </h3>
                  <div className={`mt-2 text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>{testResult.success ? `AI 返回响应: "${testResult.message}"` : testResult.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存设置'}
            </button>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isTesting ? '测试中...' : '测试连接'}
            </button>

            <div className="flex-grow"></div>

            {config && config.id !== undefined && config.id > 0 && (
              <button
                onClick={handleReset}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                恢复系统默认
              </button>
            )}
          </div>

          {saveSuccess && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1" /> 设置已成功保存
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">使用说明</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>• 大多数中转站请选 OpenAI 兼容格式，仅 Anthropic 官方API选原生格式。</p>
              <p>• Base URL 中的 /v1 路径会自动处理，输入 https://xxx.com 或 https://xxx.com/v1 均可。</p>
              <p>• 测试连接时会自动尝试两种认证格式，一种失败会切换另一种。</p>
              <p>• 常见服务: Claude 中转站、OpenAI、DeepSeek、Kimi、智谱等。</p>
              <p>• 您的 API Key 仅保存在服务器，不会在页面中完整显示。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
