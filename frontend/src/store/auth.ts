import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, LoginRequest, RegisterRequest } from '../types/auth';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface AuthStore extends AuthState {
  _hasHydrated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);

          // Save to localStorage
          localStorage.setItem('access_token', response.access_token);
          const user = { id: response.user_id, username: credentials.username };
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('登录成功！');
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || '登录失败，请检查用户名和密码';
          set({
            error: errorMessage,
            isLoading: false,
          });
          toast.error(errorMessage);
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(userData);

          // Save to localStorage
          localStorage.setItem('access_token', response.access_token);
          const user = { id: response.user_id, username: userData.username };
          localStorage.setItem('user', JSON.stringify(user));

          set({
            user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          toast.success('注册成功！');
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || '注册失败，请稍后重试';
          set({
            error: errorMessage,
            isLoading: false,
          });
          toast.error(errorMessage);
        }
      },

      logout: () => {
        authApi.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        toast.success('已退出登录');
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);

export default useAuthStore;