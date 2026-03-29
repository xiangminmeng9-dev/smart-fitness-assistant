import api from './auth';
import type { FitnessPlan, WeatherInfo, MotivationInfo } from '../types/plan';

export const planApi = {
  getPlans: async (startDate?: string, endDate?: string): Promise<FitnessPlan[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
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

  markComplete: async (planId: number, completed: boolean): Promise<void> => {
    await api.put(`/plan/${planId}/complete?completed=${completed}`);
  },

  toggleExerciseComplete: async (
    planId: number, groupIndex: number, exerciseIndex: number, completed: boolean
  ): Promise<any> => {
    const response = await api.put(
      `/plan/${planId}/exercise-complete?group_index=${groupIndex}&exercise_index=${exerciseIndex}&completed=${completed}`
    );
    return response.data;
  },

  getWeather: async (lat?: number, lng?: number): Promise<WeatherInfo> => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lng !== undefined) params.append('lng', lng.toString());
    const query = params.toString();
    const response = await api.get(`/system/weather${query ? '?' + query : ''}`);
    return response.data;
  },

  getMotivation: async (): Promise<MotivationInfo> => {
    const response = await api.get('/system/motivation');
    return response.data;
  },
};

export default planApi;
