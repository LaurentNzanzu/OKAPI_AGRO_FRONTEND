// frontend/src/services/abonnements.js
import api from './api';

const abonnementsService = {
  async getByOrganisation(organisationId) {
    const { data } = await api.get(`/abonnements/${organisationId}`);
    return data;
  },

  async getQuotas(organisationId) {
    const { data } = await api.get(`/abonnements/${organisationId}/quotas`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/abonnements/', payload);
    return data;
  },

  async renouveler(organisationId, payload) {
    const { data } = await api.post(`/abonnements/${organisationId}/renouveler`, payload);
    return data;
  },
};

export default abonnementsService;