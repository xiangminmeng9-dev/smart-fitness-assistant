import api from './auth';
import type { FitnessPlan, WeatherInfo, MotivationInfo, DailyPlanData } from '../types/plan';

// API 响应类型
interface ToggleExerciseResponse {
  id: number;
  plan_data: DailyPlanData;
  completed: boolean;
}

interface MarkCompleteResponse {
  message: string;
  completed: boolean;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

export const planApi = {
  getPlans: async (
    startDate?: string,
    endDate?: string,
    pagination?: PaginationParams
  ): Promise<FitnessPlan[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.offset) params.append('offset', pagination.offset.toString());
    const response = await api.get(`/plan/?${params.toString()}`);
    return response.data;
  },

  getTodayPlan: async (date: string): Promise<FitnessPlan> => {
    const response = await api.get(`/plan/${date}`);
    return response.data;
  },

  generatePlan: async (date: string): Promise<FitnessPlan> => {
    const response = await api.post('/plan/generate', { plan_date: date });
    return response.data;
  },

  markComplete: async (planId: number, completed: boolean): Promise<MarkCompleteResponse> => {
    const response = await api.put(`/plan/${planId}/complete?completed=${completed}`);
    return response.data;
  },

  toggleExerciseComplete: async (
    planId: number,
    groupIndex: number,
    exerciseIndex: number,
    completed: boolean
  ): Promise<ToggleExerciseResponse> => {
    const response = await api.put(
      `/plan/${planId}/exercise-complete?group_index=${groupIndex}&exercise_index=${exerciseIndex}&completed=${completed}`
    );
    return response.data;
  },

  getWeather: async (lat?: number, lng?: number, targetDate?: string): Promise<WeatherInfo> => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lng !== undefined) params.append('lng', lng.toString());
    if (targetDate) params.append('target_date', targetDate);
    const query = params.toString();
    const response = await api.get(`/system/weather${query ? '?' + query : ''}`);
    return response.data;
  },

  getMotivation: async (targetDate?: string): Promise<MotivationInfo> => {
    const params = new URLSearchParams();
    if (targetDate) params.append('target_date', targetDate);
    const query = params.toString();
    const response = await api.get(`/system/motivation${query ? '?' + query : ''}`);
    return response.data;
  },
};

export default planApi;
