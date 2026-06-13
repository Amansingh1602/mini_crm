import { create } from 'zustand';
import { authApi } from '../api';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
  
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,
  error: null,

  login: async (credentials) => {
    set({ error: null });
    try {
      const res = await authApi.login(credentials);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err.message || 'Login failed' });
      throw err;
    }
  },

  signup: async (userData) => {
    set({ error: null });
    try {
      const res = await authApi.signup(userData);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err.message || 'Sign up failed' });
      throw err;
    }
  },

  loginWithGoogle: async (credential) => {
    set({ error: null });
    try {
      const res = await authApi.googleLogin(credential);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err.message || 'Google login failed' });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isInitializing: false });
      return;
    }

    try {
      set({ token });
      const res = await authApi.me();
      set({ user: res.data, isAuthenticated: true, isInitializing: false });
    } catch (err) {
      localStorage.removeItem('token');
      set({ token: null, user: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
