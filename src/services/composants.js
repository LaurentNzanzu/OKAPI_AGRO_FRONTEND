import api from './api';

const BASE_URL = '/composants';

export const composantsService = {
  getByBienId: async (bienId) => {
    const response = await api.get(`${BASE_URL}/bien/${bienId}`);
    return response.data;
  },
  getById: async (composantId) => {
    const response = await api.get(`${BASE_URL}/${composantId}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },
  update: async (composantId, data) => {
    const response = await api.put(`${BASE_URL}/${composantId}`, data);
    return response.data;
  },
  delete: async (composantId) => {
    await api.delete(`${BASE_URL}/${composantId}`);
  },
  analyseBien: async (bienId) => {
    const response = await api.get(`${BASE_URL}/bien/${bienId}/analyse`);
    return response.data;
  }
};