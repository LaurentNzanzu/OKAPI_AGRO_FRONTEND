// frontend/src/services/facturation.js
import api from './api';

const facturationService = {
  async list(params = {}) {
    const { data } = await api.get('/facturation/', { params });
    return data;
  },

  async generer(payload) {
    const { data } = await api.post('/facturation/generer/', payload);
    return data;
  },

  async enregistrerPaiement(factureId, payload = {}) {
    const { data } = await api.post(`/facturation/${factureId}/paiement/`, payload);
    return data;
  },

  async exporterPdf(factureId) {
    const { data } = await api.get(`/facturation/${factureId}/pdf/`);
    return data;
  },
};

export default facturationService;