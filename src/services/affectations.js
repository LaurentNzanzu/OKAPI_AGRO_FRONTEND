import api from './api';

const affectationsService = {
  async list() {
    const { data } = await api.get('/affectations/');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/affectations/', payload);
    return data;
  },
  async delete(id) {
    await api.delete(`/affectations/${id}`);
  },
};

export default affectationsService;