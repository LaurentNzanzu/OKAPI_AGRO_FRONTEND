import api from './api';

const trajetsService = {
  async list(params = {}) {
    const { data } = await api.get('/trajets/', { params });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/trajets/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/trajets/', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/trajets/${id}`, payload);
    return data;
  },
  async delete(id) {
    await api.delete(`/trajets/${id}`);
  },
};

export default trajetsService;