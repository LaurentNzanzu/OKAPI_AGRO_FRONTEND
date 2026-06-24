// frontend/src/services/planComptable.js
import api from './api';

const API_URL = '/plan-comptable';

export const planComptableService = {
    /**
     * Récupère tous les comptes du plan comptable
     */
    getAll: async (params = {}) => {
        const { search, classe, type, skip = 0, limit = 10 } = params;
        
        // 1. On crée un objet "propre" contenant uniquement les paramètres qui existent vraiment
        const cleanParams = {};
        if (search) cleanParams.search = search;
        if (classe) cleanParams.classe = classe;
        if (type) cleanParams.type = type;
        if (skip !== undefined) cleanParams.skip = skip;
        if (limit !== undefined) cleanParams.limit = limit;
        
        // 2. On laisse Axios s'occuper du formatage en lui passant l'objet "params"
        const response = await api.get(API_URL, { params: cleanParams });
        return response.data;
    },

    /**
     * Récupère un compte par son ID
     */
    getById: async (id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    /**
     * Crée un nouveau compte
     */
    create: async (data) => {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    /**
     * Met à jour un compte
     */
    update: async (id, data) => {
        const response = await api.put(`${API_URL}/${id}`, data);
        return response.data;
    },

    /**
     * Supprime un compte (soft delete)
     */
    delete: async (id) => {
        await api.delete(`${API_URL}/${id}`);
    },

    /**
     * Récupère les comptes par classe
     */
    getByClasse: async (classe) => {
        const response = await api.get(`${API_URL}?classe=${classe}`);
        return response.data;
    },

    /**
     * Récupère les comptes actifs pour les sélecteurs
     */
    getActive: async () => {
        const response = await api.get(`${API_URL}?est_actif=true`);
        return response.data;
    }
};

export default planComptableService;