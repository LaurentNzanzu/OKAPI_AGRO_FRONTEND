import api from './api';

const BASE_URL = '/maintenances';

export const maintenancesService = {
    getByBienId: async (bienId, params = {}) => {
        const response = await api.get(`${BASE_URL}/bien/${bienId}`, { params });
        return response.data;
    },
    
    getMesMaintenances: async (statut = null) => {
        const url = statut ? `${BASE_URL}/mes-maintenances?statut=${statut}` : `${BASE_URL}/mes-maintenances`;
        const response = await api.get(url);
        return response.data;
    },
    
    getAVenir: async (jours = 7) => {
        const response = await api.get(`${BASE_URL}/a-venir?jours=${jours}`);
        return response.data;
    },
    
    getEnRetard: async () => {
        const response = await api.get(`${BASE_URL}/en-retard`);
        return response.data;
    },
    
    getById: async (maintenanceId) => {
        const response = await api.get(`${BASE_URL}/${maintenanceId}`);
        return response.data;
    },
    
    create: async (data) => {
        const response = await api.post(`${BASE_URL}/`, data);
        return response.data;
    },
    
    planifier: async (data) => {
        const response = await api.post(`${BASE_URL}/`, data);
        return response.data;
    },
    
    update: async (maintenanceId, data) => {
        const response = await api.put(`${BASE_URL}/${maintenanceId}`, data);
        return response.data;
    },
    
    demarrer: async (maintenanceId) => {
        const response = await api.post(`${BASE_URL}/${maintenanceId}/demarrer`);
        return response.data;
    },
    
    terminer: async (maintenanceId, data) => {
        const response = await api.post(`${BASE_URL}/${maintenanceId}/terminer`, data);
        return response.data;
    },
    
    reporter: async (maintenanceId, data) => {
        const response = await api.post(`${BASE_URL}/${maintenanceId}/reporter`, data);
        return response.data;
    },
    
    annuler: async (maintenanceId) => {
        const response = await api.post(`${BASE_URL}/${maintenanceId}/annuler`);
        return response.data;
    },
    
    getStatistiques: async (annee = null) => {
        const url = annee ? `${BASE_URL}/statistiques/summary?annee=${annee}` : `${BASE_URL}/statistiques/summary`;
        const response = await api.get(url);
        return response.data;
    },
    
    getDureeVieBien: async (bienId) => {
        const response = await api.get(`${BASE_URL}/bien/${bienId}/duree-vie`);
        return response.data;
    },

    getByPanne: async (panneId) => {
        const response = await api.get(`${BASE_URL}/panne/${panneId}`);
        return response.data;
    },
};