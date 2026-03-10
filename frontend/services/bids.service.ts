import { api } from './api';
import type { Bid, BidCreate } from '@/types';

export const bidsService = {
  placeBid: async (data: BidCreate): Promise<Bid> => {
    const res = await api.post('/bids', data);
    return res.data;
  },

  acceptBid: async (bidId: number): Promise<Bid> => {
    const res = await api.put(`/bids/${bidId}/accept`);
    return res.data;
  },

  rejectBid: async (bidId: number): Promise<Bid> => {
    const res = await api.put(`/bids/${bidId}/reject`);
    return res.data;
  },

  getMyBids: async (): Promise<Bid[]> => {
    const res = await api.get('/bids/my');
    return res.data;
  },

  getCargoBids: async (cargoId: number): Promise<Bid[]> => {
    const res = await api.get(`/cargo/${cargoId}/bids`);
    return res.data;
  },
};
