import api from './api';

const API_URL = '/ecritures';

export const ecrituresService = {
    getAll: async (params) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    getByBien: async (bienId, params = {}) => {
        const response = await api.get(`${API_URL}/bien/${bienId}`, { params });
        return response.data;
    },

    getNonValidees: async () => {
        const response = await api.get(`${API_URL}/non-validees`);
        return response.data;
    },

    getEcrituresDuJour: async () => {
        const response = await api.get(`${API_URL}/journal/jour`);
        return response.data;
    },

    valider: async (idEcriture) => {
        const response = await api.post(`${API_URL}/${idEcriture}/valider`);
        return response.data;
    },

    modifierMontant: async (idEcriture, nouveauMontant, motif) => {
        const response = await api.patch(`${API_URL}/${idEcriture}/modifier`, {
            montant: nouveauMontant,
            motif: motif
        });
        return response.data;
    },

    getDetailsCalcul: async (idEcriture) => {
        const response = await api.get(`${API_URL}/${idEcriture}/details`);
        return response.data;
    },

    repriseDepreciation: async (data) => {
        const response = await api.post(`${API_URL}/reprise-depreciation`, data);
        return response.data;
    },

    imprimerJournal: async (date) => {
        const params = date ? { date } : {};
        const response = await api.get(`${API_URL}/journal/print`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};