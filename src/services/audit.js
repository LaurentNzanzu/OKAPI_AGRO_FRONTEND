// frontend/src/services/audit.js
import api from './api';

export const auditService = {
  getLogs: async (params = {}) => {
    const filteredParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== null && value !== undefined) {
        filteredParams[key] = value;
      }
    }
    const response = await api.get('/audit/', { params: filteredParams });
    return response.data;
  },

  getLogById: async (logId) => {
    // L'URL doit correspondre à la route backend
    const response = await api.get(`/audit/${logId}`);
    return response.data;
  },

  getHistoriqueEnregistrement: async (table, id) => {
    const response = await api.get(`/audit/table/${table}/${id}`);
    return response.data;
  }
};