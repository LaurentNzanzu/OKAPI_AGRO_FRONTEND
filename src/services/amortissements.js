// frontend/src/services/amortissements.js
import api from './api';

const API_URL = '/amortissements';
const REGLES_URL = '/regles-amortissement';

export const amortissementsService = {
    // === AMORTISSEMENTS ===
    getAll: async (params) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    getByBien: async (bienId) => {
        const response = await api.get(`${API_URL}/bien/${bienId}`);
        return response.data;
    },

    getPlan: async (bienId) => {
        const response = await api.get(`${API_URL}/plan/${bienId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    getStatistics: async (annee) => {
        const params = annee ? { annee } : {};
        const response = await api.get(`${API_URL}/statistiques`, { params });
        return response.data;
    },

    getEcartsFiscaux: async (annee) => {
        const response = await api.get(`${API_URL}/ecarts-fiscaux`, { params: { annee } });
        return response.data;
    },

    getAmortissementComposants: async (bienId, exercice) => {
        const response = await api.get(`${API_URL}/composants/${bienId}`, { params: { exercice } });
        return response.data;
    },

    // === RÈGLES D'AMORTISSEMENT ===
    getRegles: async () => {
        const response = await api.get(REGLES_URL);
        return response.data;
    },

    getRegleByCategorie: async (categorie) => {
        const response = await api.get(`${REGLES_URL}/${categorie}`);
        return response.data;
    },

    createRegle: async (data) => {
        const response = await api.post(REGLES_URL, data);
        return response.data;
    },

    updateRegle: async (idRegle, data) => {
        const response = await api.put(`${REGLES_URL}/${idRegle}`, data);
        return response.data;
    },

    deleteRegle: async (idRegle) => {
        const response = await api.delete(`${REGLES_URL}/${idRegle}`);
        return response.data;
    },

    initialiserReglesDefault: async () => {
        const response = await api.post(`${REGLES_URL}/initialiser/defaults`);
        return response.data;
    },

    // === DÉPRÉCIATION ===
    appliquerDepreciation: async (bienId, data) => {
        const response = await api.post(`${API_URL}/${bienId}/depreciation`, data);
        return response.data;
    },

    getDepreciations: async (bienId) => {
        const response = await api.get(`${API_URL}/bien/${bienId}/depreciations`);
        return response.data;
    },

    cloturerExercice: async (exercice) => {
        const response = await api.post(`${API_URL}/cloture/${exercice}`);
        return response.data;
    },

    // === NOUVEAUX: CLÔTURE AVANCÉE ===
    cloturerExerciceAvecFiltres: async (payload) => {
        const response = await api.post(`${API_URL}/cloture-avancee`, payload);
        return response.data;
    },

    previsualiserCloture: async (params) => {
        const queryParams = new URLSearchParams();
        if (params.exercice) queryParams.set('exercice', String(params.exercice));
        if (params.categorie) queryParams.set('categorie', params.categorie);
        if (params.methode_forcee) queryParams.set('methode_forcee', params.methode_forcee);
        
        const response = await api.get(`${API_URL}/previsualisation-cloture?${queryParams}`);
        return response.data;
    },
    getDashboard: async () => {
        const response = await api.get(`${API_URL}/dashboard`);
        return response.data;
    },
};