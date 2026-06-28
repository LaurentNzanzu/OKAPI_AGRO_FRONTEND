// frontend/src/services/budgets.js
import api from './api';

const BUDGETS_URL = '/budgets';

export const budgetsService = {
    /**
     * Récupère la liste des budgets avec filtres
     * @param {Object} params - Paramètres de filtrage
     * @param {number} params.exercice - Exercice comptable
     * @param {string} params.centre_cout - Centre de coût
     * @param {number} params.skip - Pagination offset
     * @param {number} params.limit - Nombre d'éléments
     */
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.exercice) queryParams.set('exercice', String(params.exercice));
        if (params.centre_cout) queryParams.set('centre_cout', params.centre_cout);
        if (params.skip !== undefined) queryParams.set('skip', String(params.skip));
        if (params.limit) queryParams.set('limit', String(params.limit));
        
        const response = await api.get(`${BUDGETS_URL}?${queryParams}`);
        return response.data;
    },

    /**
     * Récupère un budget par son ID
     * @param {number} id - ID du budget
     */
    getById: async (id) => {
        const response = await api.get(`${BUDGETS_URL}/${id}`);
        return response.data;
    },

    /**
     * Crée un nouveau budget
     * @param {Object} data - Données du budget
     * @param {string} data.centre_cout - Centre de coût
     * @param {number} data.exercice - Exercice comptable
     * @param {number} data.montant_alloue - Montant alloué
     */
    create: async (data) => {
        const response = await api.post(BUDGETS_URL, data);
        return response.data;
    },

    /**
     * Met à jour un budget
     * @param {number} id - ID du budget
     * @param {Object} data - Données à mettre à jour
     */
    update: async (id, data) => {
        const response = await api.put(`${BUDGETS_URL}/${id}`, data);
        return response.data;
    },

    /**
     * Supprime un budget
     * @param {number} id - ID du budget
     */
    delete: async (id) => {
        await api.delete(`${BUDGETS_URL}/${id}`);
    },

    /**
     * Vérifie la disponibilité budgétaire (Règle d'or)
     * @param {string} centre_cout - Centre de coût
     * @param {number} exercice - Exercice comptable
     * @param {number} montant - Montant à vérifier
     */
    verifierDisponibilite: async (centre_cout, exercice, montant) => {
        const response = await api.get(`${BUDGETS_URL}/verification`, {
            params: { centre_cout, exercice, montant }
        });
        return response.data;
    },

    /**
     * Récupère la consommation d'un centre de coût
     * @param {string} centre_cout - Centre de coût
     * @param {number} exercice - Exercice comptable (optionnel)
     */
    getConsommation: async (centre_cout, exercice = null) => {
        const params = exercice ? { exercice } : {};
        const response = await api.get(`${BUDGETS_URL}/consommation/${centre_cout}`, { params });
        return response.data;
    },

    /**
     * Récupère la synthèse de tous les budgets pour un exercice
     * @param {number} exercice - Exercice comptable
     */
    getSynthese: async (exercice) => {
        const response = await api.get(`${BUDGETS_URL}/synthese/${exercice}`);
        return response.data;
    },

    /**
     * Vérifie la disponibilité de trésorerie
     * @param {number} montant - Montant à vérifier
     */
    verifierTresorerie: async (montant) => {
        const response = await api.get(`${BUDGETS_URL}/tresorerie/verification`, {
            params: { montant }
        });
        return response.data;
    }
};

export default budgetsService;