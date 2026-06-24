import api from './api';

const BASE_URL = '/validations';

export const validationsService = {
    getEnAttente: async () => {
        const response = await api.get(`${BASE_URL}/en-attente`);
        return response.data;
    },
    
    valider: async (besoinId, decision, commentaire = null) => {
        const response = await api.post(`${BASE_URL}/${besoinId}/valider`, {
            decision,
            commentaire
        });
        return response.data;
    },
    
    getWorkflow: async (besoinId) => {
        const response = await api.get(`${BASE_URL}/${besoinId}/workflow`);
        return response.data;
    },
    
    getHistorique: async (besoinId) => {
        const response = await api.get(`${BASE_URL}/historique/${besoinId}`);
        return response.data;
    }
};