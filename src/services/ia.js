// frontend/src/services/ia.js
import api from './api';

const BASE_URL = '/ia';

export const iaService = {
    /**
     * Calcule le Health Score d'un bien spécifique
     * @param {number} bienId - ID du bien
     * @returns {Promise<Object>} - Score de santé et détails
     */
    getHealthScore: async (bienId) => {
        const response = await api.get(`${BASE_URL}/health-score/${bienId}`);
        return response.data;
    },

    /**
     * Récupère les recommandations pour tout le parc
     * @returns {Promise<Array>} - Liste des scores de tous les biens
     */
    getRecommandationsParc: async () => {
        const response = await api.get(`${BASE_URL}/recommandations/parc`);
        return response.data;
    },

    /**
     * Récupère les alertes d'achat de pièces
     * @returns {Promise<Array>} - Liste des alertes
     */
    getAlertesAchat: async () => {
        const response = await api.get(`${BASE_URL}/pieces/alertes-achat`);
        return response.data;
    },
    askAssistant: async (question) => {
        const response = await api.post(`${BASE_URL}/assistant`, { question });
        return response.data;
    },

    /**
     * Génère une décision stratégique pour un bien
     * @param {number} bienId - ID du bien
     * @returns {Promise<Object>} - Décision (conserver/remplacer)
     */
    getDecisionStrategique: async (bienId) => {
        const response = await api.get(`${BASE_URL}/decision/${bienId}`);
        return response.data;
    }
};

export default iaService;