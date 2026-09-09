import api from './api';

export const configInventaireService = {
  get: async () => {
    const response = await api.get('/config/inventaire/');
    return response.data;
  },
  update: async (data) => {
    const response = await api.put('/config/inventaire/', data);
    return response.data;
  }
};