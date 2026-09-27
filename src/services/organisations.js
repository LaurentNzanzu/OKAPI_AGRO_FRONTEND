// frontend/src/services/organisations.js
import api from './api';

const organisationsService = {
  async getProfil() {
    return (await api.get('/organisations/me/profil')).data;
  },
  async updateProfil(payload) {
    return (await api.patch('/organisations/me/profil', payload)).data;
  },
  async uploadLogo(file) {
    const body = new FormData();
    body.append('file', file);
    return (await api.post('/organisations/me/logo', body, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 45000,
    })).data;
  },
  async deleteLogo() {
    return (await api.delete('/organisations/me/logo')).data;
  },
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
