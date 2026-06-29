// frontend/src/services/validations.js
import api from './api';

const BASE_URL = '/validations';

export const validationsService = {
    /**
     * Récupère les validations en attente pour l'utilisateur connecté
     * @param {string} typeValidation - Type de validation (optionnel)
     */
    getEnAttente: async (typeValidation = null) => {
        const params = typeValidation ? { type_validation: typeValidation } : {};
        const response = await api.get(`${BASE_URL}/en-attente`, { params });
        return response.data;
    },
    
    /**
     * Approuve un besoin directement par son ID
     * @param {number} besoinId - ID du besoin
     * @param {Object} data - Données d'approbation
     */
    approuver: async (besoinId, data = {}) => {
        const response = await api.post(`${BASE_URL}/besoin/${besoinId}/approuver`, data);
        return response.data;
    },
    
    /**
     * Rejette un besoin directement par son ID
     * @param {number} besoinId - ID du besoin
     * @param {Object} data - Données de rejet
     */
    rejeter: async (besoinId, data = {}) => {
        const response = await api.post(`${BASE_URL}/besoin/${besoinId}/rejeter`, data);
        return response.data;
    },

    /**
     * Méthode générique valider (compatible)
     */
    valider: async (besoinId, decision, commentaire = '') => {
        if (decision === 'APPROUVE') {
            return validationsService.approuver(besoinId, { commentaire });
        } else if (decision === 'REJETE') {
            return validationsService.rejeter(besoinId, { motif_rejet: commentaire || 'Rejeté sans motif' });
        }
        throw new Error('Décision invalide');
    },

    /**
     * Approuve une validation par son ID de validation (compatibilité)
     */
    approuverValidation: async (validationId, data = {}) => {
        const response = await api.post(`${BASE_URL}/${validationId}/approuver`, {
            commentaire: data.commentaire || null,
            piece_justificative_url: data.piece_justificative_url || null
        });
        return response.data;
    },

    /**
     * Rejette une validation par son ID de validation (compatibilité)
     */
    rejeterValidation: async (validationId, data = {}) => {
        const response = await api.post(`${BASE_URL}/${validationId}/rejeter`, {
            motif_rejet: data.motif_rejet || 'Rejeté sans motif',
            commentaire: data.commentaire || null,
            piece_justificative_url: data.piece_justificative_url || null
        });
        return response.data;
    },
    
    /**
     * Récupère le workflow d'une validation
     * @param {number} besoinId - ID du besoin
     */
    getWorkflow: async (besoinId) => {
        const response = await api.get(`${BASE_URL}/${besoinId}/workflow`);
        return response.data;
    },
    
    /**
     * Récupère l'historique des validations
     * @param {number} besoinId - ID du besoin
     */
    getHistorique: async (besoinId) => {
        const response = await api.get(`${BASE_URL}/historique/${besoinId}`);
        return response.data;
    },

    /**
     * Récupère les types de validation disponibles
     */
    getTypes: async () => {
        const response = await api.get(`${BASE_URL}/types`);
        return response.data;
    },

    /**
     * Récupère les ordres de validation disponibles
     */
    getOrdres: async () => {
        const response = await api.get(`${BASE_URL}/ordres`);
        return response.data;
    }
};

export default validationsService;