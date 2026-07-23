// frontend/src/services/concertations.js
import api from './api';

const BASE_URL = '/concertations';

export const concertationsService = {
    /**
     * Récupère toutes les discussions d'un bien
     * @param {number} bienId - ID du bien
     * @param {string} typeValidation - Type de validation (CESSION ou REBUT) - Optionnel
     */
    getByBien: async (bienId, typeValidation = null) => {
        const url = typeValidation 
            ? `${BASE_URL}/bien/${bienId}?type_validation=${typeValidation}`
            : `${BASE_URL}/bien/${bienId}`;
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Crée une nouvelle discussion de concertation
     * @param {Object} data - Données de la discussion
     * @param {number} data.id_bien - ID du bien
     * @param {string} data.type_validation - Type de validation (CESSION ou REBUT)
     * @param {string} data.titre - Titre de la discussion
     */
    creer: async (data) => {
        const response = await api.post(BASE_URL, data);
        return response.data;
    },

    /**
     * Récupère les détails d'une discussion
     * @param {number} discussionId - ID de la discussion
     */
    getById: async (discussionId) => {
        const response = await api.get(`${BASE_URL}/${discussionId}`);
        return response.data;
    },

    /**
     * Récupère le statut de validation d'une discussion
     * @param {number} discussionId - ID de la discussion
     */
    getStatut: async (discussionId) => {
        const response = await api.get(`${BASE_URL}/${discussionId}/statut`);
        return response.data;
    },

    /**
     * Vérifie l'éligibilité d'une action pour un bien
     * @param {number} bienId - ID du bien
     * @param {string} typeValidation - Type de validation (CESSION ou REBUT)
     */
    verifierEligibilite: async (bienId, typeValidation) => {
        const response = await api.get(`${BASE_URL}/bien/${bienId}/eligibilite/${typeValidation}`);
        return response.data;
    },

    /**
     * Ajoute un message à une discussion
     * @param {number} discussionId - ID de la discussion
     * @param {Object} data - Données du message
     * @param {string} data.contenu - Contenu du message
     * @param {number} data.parent_id - ID du message parent (pour réponse) - Optionnel
     */
    ajouterMessage: async (discussionId, data) => {
        const response = await api.post(`${BASE_URL}/${discussionId}/messages`, data);
        return response.data;
    },

    /**
     * Modifie un message existant
     * @param {number} messageId - ID du message
     * @param {string} contenu - Nouveau contenu du message
     */
    modifierMessage: async (messageId, contenu) => {
        const response = await api.put(`${BASE_URL}/messages/${messageId}?contenu=${encodeURIComponent(contenu)}`);
        return response.data;
    },

    /**
     * Enregistre une validation individuelle (DG ou Comptable)
     * @param {number} discussionId - ID de la discussion
     * @param {Object} data - Données de validation
     * @param {string} data.decision - Décision (APPROUVE ou REJETE)
     * @param {string} data.commentaire - Commentaire - Optionnel
     */
    valider: async (discussionId, data) => {
        const response = await api.post(`${BASE_URL}/${discussionId}/valider`, data);
        return response.data;
    },

    /**
     * Clôture une discussion
     * @param {number} discussionId - ID de la discussion
     */
    cloturer: async (discussionId) => {
        const response = await api.post(`${BASE_URL}/${discussionId}/cloturer`);
        return response.data;
    }
};

export default concertationsService;