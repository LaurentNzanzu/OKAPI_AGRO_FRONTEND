import api from './api';

const vehiculesService = {
  async list(params = {}) {
    const { data } = await api.get('/vehicules/', { params });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/vehicules/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/vehicules/', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/vehicules/${id}`, payload);
    return data;
  },
  async delete(id) {
    await api.delete(`/vehicules/${id}`);
  },
};

export default vehiculesService;