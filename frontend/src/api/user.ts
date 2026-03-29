import api from './auth';
import type { UserProfile, UserProfileCreate, UserProfileUpdate } from '../types/user';

export const userApi = {
  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Create or update user profile
  createOrUpdateProfile: async (profileData: UserProfileCreate): Promise<UserProfile> => {
    const response = await api.post('/user/profile', profileData);
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: UserProfileUpdate): Promise<UserProfile> => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  // Get location from browser
  getCurrentLocation: (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = '无法获取位置信息';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '用户拒绝了位置请求';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用';
              break;
            case error.TIMEOUT:
              errorMessage = '获取位置超时';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },
};

export default userApi;