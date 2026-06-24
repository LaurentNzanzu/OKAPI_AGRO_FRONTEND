import api from './api';

const BASE_URL = '/pannes';

export const pannesService = {
  getByBienId: async (bienId) => {
    const response = await api.get(`${BASE_URL}/bien/${bienId}`);
    return response.data;
  },
  getActives: async () => {
    const response = await api.get(`${BASE_URL}/actives`);
    return response.data;
  },
  getMesPannes: async (statut = null) => {
    const url = statut ? `${BASE_URL}/mes-pannes?statut=${statut}` : `${BASE_URL}/mes-pannes`;
    const response = await api.get(url);
    return response.data;
  },
  getById: async (panneId) => {
    const response = await api.get(`${BASE_URL}/${panneId}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },
  update: async (panneId, data) => {
    const response = await api.put(`${BASE_URL}/${panneId}`, data);
    return response.data;
  },
  changerStatut: async (panneId, statut) => {
    const response = await api.patch(`${BASE_URL}/${panneId}/statut?statut=${statut}`);
    return response.data;
  },
  getStatistiques: async (bienId = null) => {
    const url = bienId ? `${BASE_URL}/statistiques/summary?bien_id=${bienId}` : `${BASE_URL}/statistiques/summary`;
    const response = await api.get(url);
    return response.data;
  },
  resoudre: async (panneId) => {
    const response = await api.post(`${BASE_URL}/${panneId}/resoudre`);
    return response.data;
  },
};