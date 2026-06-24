import api from './api';

const BASE_URL = '/besoins';

export const besoinsService = {
  getByPanneId: async (panneId) => {
    const response = await api.get(`${BASE_URL}/panne/${panneId}`);
    return response.data;
  },
  getById: async (besoinId) => {
    const response = await api.get(`${BASE_URL}/${besoinId}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },
  getAValider: async () => {
    const response = await api.get(`${BASE_URL}/a-valider`);
    return response.data;
  },
  valider: async (besoinId, decision, commentaire = null) => {
    const url = commentaire
      ? `${BASE_URL}/${besoinId}/valider?decision=${decision}&commentaire=${encodeURIComponent(commentaire)}`
      : `${BASE_URL}/${besoinId}/valider?decision=${decision}`;
    const response = await api.post(url);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get(BASE_URL);
    return response.data;
  },
  getEnAttenteStock: async () => {
    const response = await api.get(`${BASE_URL}/attente-stock`);
    return response.data;
  },
};