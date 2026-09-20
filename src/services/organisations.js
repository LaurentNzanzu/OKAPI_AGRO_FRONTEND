// frontend/src/services/organisations.js
import api from './api';

const organisationsService = {
  async list(params = {}) {
    const { data } = await api.get('/organisations/', { params });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/organisations/${id}/`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/organisations/', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/organisations/${id}/`, payload);
    return data;
  },

  async suspendre(id, motif) {
    const { data } = await api.post(`/organisations/${id}/suspendre/`, { motif });
    return data;
  },

  async reactiver(id) {
    const { data } = await api.post(`/organisations/${id}/reactiver/`);
    return data;
  },
};

export default organisationsService;