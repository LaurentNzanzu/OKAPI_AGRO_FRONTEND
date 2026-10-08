import api from './api';

const missionsService = {
  async list(params = {}) {
    const { data } = await api.get('/missions/', { params });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/missions/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/missions/', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/missions/${id}`, payload);
    return data;
  },
  async delete(id) {
    await api.delete(`/missions/${id}`);
  },
  async soumettre(id) {
    const { data } = await api.post(`/missions/${id}/soumettre`);
    return data;
  },
  async valider(id) {
    const { data } = await api.post(`/missions/${id}/valider`);
    return data;
  },
  async rejeter(id, motif) {
    const { data } = await api.post(`/missions/${id}/rejeter`, { motif });
    return data;
  },
  async affecter(id, payload) {
    const { data } = await api.post(`/missions/${id}/affecter`, payload);
    return data;
  },
  async demarrer(id, payload) {
    const { data } = await api.post(`/missions/${id}/demarrer`, payload);
    return data;
  },
  async terminer(id, payload) {
    const { data } = await api.post(`/missions/${id}/terminer`, payload);
    return data;
  },
  async annuler(id, payload) {
    const { data } = await api.post(`/missions/${id}/annuler`, payload);
    return data;
  },
};

export default missionsService;