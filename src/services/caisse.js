// frontend/src/services/caisse.js
import api from './api';

const BASE_URL = '/caisses';

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
    }
};

export default caisseService;
