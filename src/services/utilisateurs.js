// services/utilisateurs.js
import api from './api'; // suppose que vous avez une instance axios

export const utilisateursService = {
    // Récupérer tous les utilisateurs
    getAll: async () => {
        const response = await api.get('/utilisateurs');
        return response.data;
    },

    // Récupérer un utilisateur par ID
    getById: async (id) => {
        const response = await api.get(`/utilisateurs/${id}`);
        return response.data;
    },

    // Créer un utilisateur
    create: async (data) => {
        const response = await api.post('/utilisateurs', data);
        return response.data;
    },

    // Mettre à jour
    update: async (id, data) => {
        const response = await api.put(`/utilisateurs/${id}`, data);
        return response.data;
    },

    // Supprimer
    delete: async (id) => {
        const response = await api.delete(`/utilisateurs/${id}`);
        return response.data;
    },
    
    toggleActif: async (id, estActif) => {
        const response = await api.patch(`/utilisateurs/${id}/toggle-actif`);
        return response.data;
    }
};