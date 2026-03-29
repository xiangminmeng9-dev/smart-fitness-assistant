import { create } from 'zustand';
import type { UserProfile, UserProfileCreate, ProfileFormErrors } from '../types/user';
import { userApi } from '../api/user';
import toast from 'react-hot-toast';

interface ProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  formErrors: ProfileFormErrors;
  locationLoading: boolean;
  locationError: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  saveProfile: (profileData: UserProfileCreate) => Promise<boolean>;
  updateProfile: (profileData: UserProfileCreate) => Promise<boolean>;
  getLocation: () => Promise<{ lat: number; lng: number } | null>;
  clearErrors: () => void;
  setFormErrors: (errors: ProfileFormErrors) => void;
  validateForm: (data: UserProfileCreate) => ProfileFormErrors;
}

const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  formErrors: {},
  locationLoading: false,
  locationError: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userApi.getProfile();
      set({ profile, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '获取个人信息失败';
      set({ error: errorMessage, isLoading: false });
      // Don't show toast for 404 (profile not created yet)
      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }
    }
  },

  saveProfile: async (profileData: UserProfileCreate) => {
    set({ isSubmitting: true, error: null, formErrors: {} });

    // Validate form
    const errors = get().validateForm(profileData);
    if (Object.keys(errors).length > 0) {
      set({ formErrors: errors, isSubmitting: false });
      toast.error('请检查表单填写是否正确');
      return false;
    }

    try {
      const profile = await userApi.createOrUpdateProfile(profileData);
      set({ profile, isSubmitting: false });
      toast.success('个人信息保存成功！');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '保存个人信息失败';
      set({ error: errorMessage, isSubmitting: false });
      toast.error(errorMessage);
      return false;
    }
  },

  updateProfile: async (profileData: UserProfileCreate) => {
    set({ isSubmitting: true, error: null, formErrors: {} });

    // Validate form
    const errors = get().validateForm(profileData);
    if (Object.keys(errors).length > 0) {
      set({ formErrors: errors, isSubmitting: false });
      toast.error('请检查表单填写是否正确');
      return false;
    }

    try {
      const profile = await userApi.updateProfile(profileData);
      set({ profile, isSubmitting: false });
      toast.success('个人信息更新成功！');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || '更新个人信息失败';
      set({ error: errorMessage, isSubmitting: false });
      toast.error(errorMessage);
      return false;
    }
  },

  getLocation: async () => {
    set({ locationLoading: true, locationError: null });
    try {
      const location = await userApi.getCurrentLocation();
      set({ locationLoading: false });
      toast.success('位置获取成功');
      return location;
    } catch (error: any) {
      const errorMessage = error.message || '获取位置失败';
      set({ locationLoading: false, locationError: errorMessage });
      toast.error(errorMessage);
      return null;
    }
  },

  clearErrors: () => {
    set({ error: null, formErrors: {}, locationError: null });
  },

  setFormErrors: (errors: ProfileFormErrors) => {
    set({ formErrors: errors });
  },

  validateForm: (data: UserProfileCreate): ProfileFormErrors => {
    const errors: ProfileFormErrors = {};

    if (data.age !== undefined) {
      if (data.age < 10 || data.age > 100) {
        errors.age = '年龄应在10-100岁之间';
      }
    }

    if (data.height !== undefined) {
      if (data.height < 100 || data.height > 250) {
        errors.height = '身高应在100-250cm之间';
      }
    }

    if (data.weight !== undefined) {
      if (data.weight < 30 || data.weight > 300) {
        errors.weight = '体重应在30-300kg之间';
      }
    }

    if (data.fitness_frequency !== undefined) {
      if (data.fitness_frequency < 1 || data.fitness_frequency > 7) {
        errors.fitness_frequency = '每周健身频次应为1-7次';
      }
    }

    return errors;
  },
}));

export default useProfileStore;