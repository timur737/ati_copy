import { api } from './api';
import type { Driver, DriverCreate } from '@/types';

export const driverService = {
  getMyDriver: async (): Promise<Driver> => {
    const res = await api.get('/drivers/me');
    return res.data;
  },

  createDriver: async (data: DriverCreate): Promise<Driver> => {
    const res = await api.post('/drivers/me', data);
    return res.data;
  },

  listDrivers: async (moderationStatus?: string): Promise<Driver[]> => {
    const params = moderationStatus ? { moderation_status: moderationStatus } : {};
    const res = await api.get('/drivers', { params });
    return res.data;
  },

  moderateDriver: async (
    driverId: number,
    moderationStatus: string,
    rejectionReason?: string
  ): Promise<Driver> => {
    const res = await api.patch(`/drivers/${driverId}/moderate`, {
      moderation_status: moderationStatus,
      rejection_reason: rejectionReason,
    });
    return res.data;
  },
};
