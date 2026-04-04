import { create } from 'zustand';
import type { FitnessPlan, WeatherInfo, MotivationInfo } from '../types/plan';
import { planApi } from '../api/plan';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];

interface PlanStore {
  todayPlan: FitnessPlan | null;
  weather: WeatherInfo | null;
  motivation: MotivationInfo | null;
  selectedDate: string;
  isLoading: boolean;
  isGenerating: boolean;
  isWeatherLoading: boolean;
  error: string | null;

  fetchTodayPlan: (date: string) => Promise<void>;
  generateTodayPlan: (date: string) => Promise<boolean>;
  toggleComplete: (planId: number, completed: boolean) => Promise<void>;
  toggleExerciseComplete: (planId: number, groupIndex: number, exerciseIndex: number, completed: boolean) => Promise<void>;
  setSelectedDate: (date: string) => void;
  fetchWeather: (lat?: number, lng?: number, targetDate?: string) => Promise<void>;
  fetchMotivation: (targetDate?: string) => Promise<void>;
}

const usePlanStore = create<PlanStore>((set, get) => ({
  todayPlan: null,
  weather: null,
  motivation: null,
  selectedDate: today,
  isLoading: false,
  isGenerating: false,
  isWeatherLoading: false,
  error: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date, weather: null }); // Clear weather when date changes
    get().fetchTodayPlan(date);
  },

  fetchTodayPlan: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await planApi.getTodayPlan(date);
      set({ todayPlan: plan, isLoading: false });
    } catch (error: any) {
      if (error.response?.status === 404) {
        set({ todayPlan: null, isLoading: false });
      } else {
        const msg = error.response?.data?.detail || '获取计划失败';
        set({ error: msg, isLoading: false });
        toast.error(msg);
      }
    }
  },

  generateTodayPlan: async (date: string) => {
    set({ isGenerating: true, error: null });
    try {
      const plan = await planApi.generatePlan(date);
      set({ todayPlan: plan, isGenerating: false });
      toast.success('健身计划生成成功！');
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.detail || '生成计划失败';
      set({ error: msg, isGenerating: false });
      toast.error(msg);
      return false;
    }
  },

  toggleComplete: async (planId: number, completed: boolean) => {
    try {
      await planApi.markComplete(planId, completed);
      const plan = get().todayPlan;
      if (plan && plan.id === planId) {
        set({ todayPlan: { ...plan, completed } });
      }
      toast.success(completed ? '已完成今日计划！' : '已取消完成标记');
    } catch (error: any) {
      const msg = error.response?.data?.detail || '更新状态失败';
      toast.error(msg);
    }
  },

  toggleExerciseComplete: async (planId: number, groupIndex: number, exerciseIndex: number, completed: boolean) => {
    try {
      const result = await planApi.toggleExerciseComplete(planId, groupIndex, exerciseIndex, completed);
      // 更新本地状态
      const currentPlan = get().todayPlan;
      if (currentPlan && currentPlan.id === planId) {
        set({
          todayPlan: {
            ...currentPlan,
            plan_data: result.plan_data,
            completed: result.completed
          }
        });
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || '更新动作状态失败';
      toast.error(msg);
    }
  },

  fetchWeather: async (lat?: number, lng?: number, targetDate?: string) => {
    set({ isWeatherLoading: true });
    try {
      const weather = await planApi.getWeather(lat, lng, targetDate);
      set({ weather, isWeatherLoading: false });
    } catch {
      set({ isWeatherLoading: false });
      // silent fail for weather
    }
  },

  fetchMotivation: async (targetDate?: string) => {
    try {
      const motivation = await planApi.getMotivation(targetDate);
      set({ motivation });
    } catch {
      // silent fail for motivation
    }
  },
}));

export default usePlanStore;
