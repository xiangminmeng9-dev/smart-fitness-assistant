import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and update Zustand state
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      // Dynamically import to avoid circular dependency
      import('../store/auth').then(mod => {
        mod.default.setState({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      });
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};

export default api;