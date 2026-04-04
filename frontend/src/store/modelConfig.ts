import { create } from 'zustand';
import { modelConfigApi } from '../api/modelConfig';
import type { ModelConfig, ProviderInfo, TestResult } from '../types/modelConfig';

interface ModelConfigStore {
  config: ModelConfig | null;
  providers: ProviderInfo[];
  systemDefault: string;
  isLoading: boolean;
  isSaving: boolean;
  isTesting: boolean;
  testResult: TestResult | null;
  error: string | null;

  fetchProviders: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  saveConfig: (config: Partial<ModelConfig>) => Promise<boolean>;
  deleteConfig: () => Promise<boolean>;
  testConfig: (config: Partial<ModelConfig>) => Promise<boolean>;
  clearTestResult: () => void;
}

export const useModelConfigStore = create<ModelConfigStore>((set) => ({
  config: null,
  providers: [],
  systemDefault: 'claude',
  isLoading: false,
  isSaving: false,
  isTesting: false,
  testResult: null,
  error: null,

  fetchProviders: async () => {
    try {
      const res = await modelConfigApi.getProviders();
      set({ providers: res.providers, systemDefault: res.system_default });
    } catch (err: any) {
      console.error('Failed to fetch providers', err);
    }
  },

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await modelConfigApi.getConfig();
      set({ config, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || '获取配置失败', isLoading: false });
    }
  },

  saveConfig: async (configData) => {
    set({ isSaving: true, error: null });
    try {
      const config = await modelConfigApi.saveConfig(configData);
      set({ config, isSaving: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || '保存配置失败', isSaving: false });
      return false;
    }
  },

  deleteConfig: async () => {
    set({ isSaving: true, error: null });
    try {
      await modelConfigApi.deleteConfig();
      await useModelConfigStore.getState().fetchConfig();
      set({ isSaving: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.detail || '恢复默认失败', isSaving: false });
      return false;
    }
  },

  testConfig: async (configData) => {
    set({ isTesting: true, testResult: null });
    try {
      const testResult = await modelConfigApi.testConfig(configData);
      set({ testResult, isTesting: false });
      return testResult.success;
    } catch (err: any) {
      set({ 
        testResult: { success: false, error: err.response?.data?.detail || '网络请求失败' }, 
        isTesting: false 
      });
      return false;
    }
  },

  clearTestResult: () => set({ testResult: null })
}));
