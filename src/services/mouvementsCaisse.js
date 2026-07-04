// frontend/src/services/mouvementsCaisse.js
import api from './api';

const BASE_URL = '/caisse';

export const mouvementsCaisseService = {
    getAll: async (params) => {
        const response = await api.get(`${BASE_URL}/mouvements`, { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`${BASE_URL}/mouvements/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post(`${BASE_URL}/mouvements`, data);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.post(`${BASE_URL}/mouvements/${id}/valider`);
        return response.data;
    },

    signDG: async (id, data) => {
        const response = await api.post(`${BASE_URL}/mouvements/${id}/dg-sign`, data);
        return response.data;
    },

    getPDF: async (id) => {
        const response = await api.get(`${BASE_URL}/mouvements/${id}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export default mouvementsCaisseService;
