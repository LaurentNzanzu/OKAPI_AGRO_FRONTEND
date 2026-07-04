// frontend/src/services/caisse.js
import api from './api';

const BASE_URL = '/caisses';
const MOVEMENTS_BASE_URL = '/caisse';

export const caisseService = {
    /**
     * Vérifie si le solde disponible en caisse est suffisant pour un montant
     * @param {number} montant 
     */
    verifierTresorerie: async (montant) => {
        const response = await api.get(`${BASE_URL}/verifier-tresorerie`, {
            params: { montant }
        });
        return response.data;
    },

    /**
     * Récupère la caisse active principale
     */
    getPrincipale: async () => {
        const response = await api.get(`${BASE_URL}/principale`);
        return response.data;
    },

    /**
     * Liste toutes les caisses
     */
    getCaisses: async () => {
        const response = await api.get(`${BASE_URL}/`);
        return response.data;
    },

    /**
     * Effectue un rapprochement de caisse
     * @param {number} idCaisse 
     * @param {number} soldePhysique 
     */
    effectuerRapprochement: async (idCaisse, soldePhysique) => {
        const response = await api.post(`${BASE_URL}/${idCaisse}/rapprochement`, null, {
            params: { solde_physique: soldePhysique }
        });
        return response.data;
    },

    // --- NOUVELLES METHODES CAISSE TACHE 8 ---
    getSolde: async () => {
        const response = await api.get(`${MOVEMENTS_BASE_URL}/solde`);
        return response.data;
    },

    createMouvement: async (data) => {
        const response = await api.post(`${MOVEMENTS_BASE_URL}/mouvements`, data);
        return response.data;
    },

    getMouvements: async (params) => {
        const response = await api.get(`${MOVEMENTS_BASE_URL}/mouvements`, { params });
        return response.data;
    },

    getMouvement: async (id) => {
        const response = await api.get(`${MOVEMENTS_BASE_URL}/mouvements/${id}`);
        return response.data;
    },

    downloadPDF: async (id) => {
        const response = await api.get(`${MOVEMENTS_BASE_URL}/mouvements/${id}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    validerMouvement: async (id) => {
        const response = await api.post(`${MOVEMENTS_BASE_URL}/mouvements/${id}/valider`);
        return response.data;
    },

    signerDG: async (id, data) => {
        const response = await api.post(`${MOVEMENTS_BASE_URL}/mouvements/${id}/dg-sign`, data);
        return response.data;
    },

    approvisionner: async (data) => {
        const response = await api.post(`${MOVEMENTS_BASE_URL}/approvisionner`, data);
        return response.data;
    }
};

export default caisseService;
