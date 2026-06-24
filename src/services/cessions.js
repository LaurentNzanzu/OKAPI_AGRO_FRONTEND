import api from './api';

const BASE_URL = '/cessions';

export const cessionsService = {
  creer: async (data) => {
    const response = await api.post(`${BASE_URL}/`, data);
    return response.data;
  },

  mettreAuRebut: async (data) => {
    const response = await api.post(`${BASE_URL}/rebut`, data);
    return response.data;
  },
};

export default cessionsService;
