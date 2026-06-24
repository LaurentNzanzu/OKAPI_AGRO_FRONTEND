// frontend/src/services/pieces.js
import api from './api';

const BASE_URL = '/pieces';

export const piecesService = {
    getAll: async (params = {}) => {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    },
    getById: async (pieceId) => {
        const response = await api.get(`${BASE_URL}/${pieceId}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post(BASE_URL, data);
        return response.data;
    },
    update: async (pieceId, data) => {
        const response = await api.put(`${BASE_URL}/${pieceId}`, data);
        return response.data;
    },
    delete: async (pieceId) => {
        await api.delete(`${BASE_URL}/${pieceId}`);
    },
    
    // Recherche par numéro de série (scan)
    rechercherParNumeroSerie: async (numeroSerie) => {
        const response = await api.get(`${BASE_URL}/scan/${encodeURIComponent(numeroSerie)}`);
        return response.data;
    },
    
    // Recherche par désignation (manuel)
    rechercherParDesignation: async (designation) => {
        const response = await api.get(`${BASE_URL}/recherche`, {
            params: { q: designation }
        });
        return response.data;
    }
};

export default piecesService;