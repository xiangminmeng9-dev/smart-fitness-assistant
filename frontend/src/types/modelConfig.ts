export interface ModelConfig {
  id?: number;
  user_id?: number;
  provider_type: string;
  base_url?: string | null;
  api_key?: string | null;
  model_name?: string | null;
  api_key_set?: boolean;
  api_key_hint?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProviderInfo {
  type: string;
  name: string;
  api_format: string;
  default_base_url: string;
  default_model: string;
}

export interface ProviderListResponse {
  providers: ProviderInfo[];
  system_default: string;
}

export interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
}
