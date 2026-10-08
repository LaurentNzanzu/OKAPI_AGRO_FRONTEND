import api from './api';

const chauffeursService = {
  async list(params = {}) {
    const { data } = await api.get('/chauffeurs/', { params });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/chauffeurs/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/chauffeurs/', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/chauffeurs/${id}`, payload);
    return data;
  },
  async delete(id) {
    await api.delete(`/chauffeurs/${id}`);
  },
  async getDisponibles(params = {}) {
    const { data } = await api.get('/chauffeurs/disponibles', { params });
    return data;
  },
  async getExpirations() {
    const { data } = await api.get('/chauffeurs/expirations');
    return data;
  },
};

export default chauffeursService;