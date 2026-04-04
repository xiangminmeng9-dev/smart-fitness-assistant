import api from './auth';
import type { ModelConfig, ProviderListResponse, TestResult } from '../types/modelConfig';

export const modelConfigApi = {
  getProviders: async (): Promise<ProviderListResponse> => {
    const response = await api.get('/model-config/providers');
    return response.data;
  },
  
  getConfig: async (): Promise<ModelConfig> => {
    const response = await api.get('/model-config/');
    return response.data;
  },
  
  saveConfig: async (config: Partial<ModelConfig>): Promise<ModelConfig> => {
    const response = await api.post('/model-config/', config);
    return response.data;
  },
  
  deleteConfig: async (): Promise<void> => {
    await api.delete('/model-config/');
  },
  
  testConfig: async (config: Partial<ModelConfig>): Promise<TestResult> => {
    const response = await api.post('/model-config/test', config);
    return response.data;
  },
};
