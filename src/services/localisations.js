// frontend/src/services/localisations.js
import api from './api';

const BASE_URL = '/localisations';

export const localisationsService = {
  getAll: async (params = {}) => {
    const { skip = 0, limit = 500 } = params;
    const queryParams = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });
    const response = await api.get(`${BASE_URL}/?${queryParams}`);
    return response.data;
  },

  // Nouvelle méthode pour créer une localisation
  create: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },
};

export default localisationsService;