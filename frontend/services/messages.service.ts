import { api } from './api';
import type { Message } from '@/types';

export const messagesService = {
  getConversations: async (): Promise<Message[]> => {
    const res = await api.get('/messages');
    return res.data;
  },

  getThread: async (partnerId: number, skip = 0, limit = 50): Promise<Message[]> => {
    const res = await api.get(`/messages/${partnerId}`, { params: { skip, limit } });
    return res.data;
  },

  send: async (receiverId: number, text: string): Promise<Message> => {
    const res = await api.post('/messages', { receiver_id: receiverId, text });
    return res.data;
  },
};
