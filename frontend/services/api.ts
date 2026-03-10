import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://147.45.107.202:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: refresh on 401 ────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        refreshQueue.forEach((cb) => cb(data.access_token));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
