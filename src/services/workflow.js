// frontend/src/services/workflow.js
import api from './api';

const workflowService = {
  async listerEtapes(typeWorkflow) {
    const { data } = await api.get(`/workflow/${typeWorkflow}/`);
    return data;
  },

  async creerEtape(typeWorkflow, payload) {
    const { data } = await api.post(`/workflow/${typeWorkflow}/etapes/`, payload);
    return data;
  },

  async modifierEtape(etapeId, payload) {
    const { data } = await api.put(`/workflow/etapes/${etapeId}/`, payload);
    return data;
  },

  async supprimerEtape(etapeId) {
    await api.delete(`/workflow/etapes/${etapeId}/`);
  },
};

export default workflowService;