import { api } from './api';
import type { Cargo, CargoCreate, CargoFilters, PaginatedCargo } from '@/types';

interface ListParams extends CargoFilters {
  page?: number;
  page_size?: number;
  sort_by?: string;
  order?: string;
}

export const cargoService = {
  list: async (params: ListParams = {}): Promise<PaginatedCargo> => {
    const res = await api.get('/cargo', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Cargo> => {
    const res = await api.get(`/cargo/${id}`);
    return res.data;
  },

  create: async (data: CargoCreate): Promise<Cargo> => {
    const res = await api.post('/cargo', data);
    return res.data;
  },

  update: async (id: number, data: Partial<CargoCreate>): Promise<Cargo> => {
    const res = await api.put(`/cargo/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/cargo/${id}`);
  },
};
