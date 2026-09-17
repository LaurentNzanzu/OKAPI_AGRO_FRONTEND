// frontend/src/services/projets.js
import api from './api';

const projetsService = {
  async list(params = {}) {
    const { data } = await api.get('/projets/', { params });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/projets/${id}/`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/projets/', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/projets/${id}/`, payload);
    return data;
  },

  async desactiver(id) {
    await api.delete(`/projets/${id}/`);
  },

  async getBudget(id, exercice = null) {
    const params = exercice ? { exercice } : {};
    const { data } = await api.get(`/projets/${id}/budget/`, { params });
    return data;
  },
};

export default projetsService;