// frontend/src/services/audit.js
import api from './api';

export const auditService = {
    /**
     * Récupère les logs d'audit avec filtres
     */
    getLogs: async (params = {}) => {
        const filteredParams = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== '' && value !== null && value !== undefined) {
                filteredParams[key] = value;
            }
        }
        const response = await api.get('/audit/', { params: filteredParams });
        return response.data;
    },

    /**
     * Récupère un log par son ID
     */
    getLogById: async (logId) => {
        const response = await api.get(`/audit/${logId}`);
        return response.data;
    },

    /**
     * Récupère l'historique d'un enregistrement
     */
    getHistoriqueEnregistrement: async (table, id) => {
        const response = await api.get(`/audit/table/${table}/${id}`);
        return response.data;
    },

    // ============================================================
    // NOUVEAUX SERVICES TÂCHE 3
    // ============================================================

    /**
     * Récupère le journal des immobilisations d'un bien
     */
    getJournalImmobilisations: async (bienId) => {
        const response = await api.get(`/rapports/journal-immobilisations/${bienId}`);
        return response.data;
    },

    /**
     * Récupère le journal des immobilisations dans l'ordre chronologique
     */
    getJournalImmobilisationsChronologique: async (bienId) => {
        const response = await api.get(`/rapports/journal-immobilisations/bien/${bienId}/chronologique`);
        return response.data;
    },

    /**
     * Récupère les statistiques du journal des immobilisations
     */
    getJournalStatistiques: async (dateDebut = null, dateFin = null) => {
        const params = new URLSearchParams();
        if (dateDebut) params.append('date_debut', dateDebut);
        if (dateFin) params.append('date_fin', dateFin);
        const url = `/rapports/journal-immobilisations/statistiques${params.toString() ? '?' + params.toString() : ''}`;
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Récupère l'arbre de remplacement d'un bien
     */
    getArbreRemplacement: async (bienId, inverse = false) => {
        const response = await api.get(`/rapports/journal-immobilisations/arbre/${bienId}?inverse=${inverse}`);
        return response.data;
    }
};

export default auditService;