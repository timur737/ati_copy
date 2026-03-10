import { api } from './api';
import type { LoginRequest, RegisterRequest, TokenPair, User } from '@/types';

export const authService = {
  register: async (data: RegisterRequest): Promise<User> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<TokenPair> => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  logout: async (accessToken: string): Promise<void> => {
    await api.post('/auth/logout', null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/users/me');
    return res.data;
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const res = await api.put('/users/me', data);
    return res.data;
  },
};
