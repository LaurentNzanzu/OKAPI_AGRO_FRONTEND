// frontend/src/services/cessions.js
import api from './api';

const BASE_URL = '/cessions';

export const cessionsService = {
  /**
   * Crée une cession (avec vérification double validation)
   * @param {Object} data - Données de la cession
   */
  creer: async (data) => {
    const response = await api.post(`${BASE_URL}/`, data);
    return response.data;
  },

  /**
   * Met un bien au rebut (avec vérification double validation + diagnostic)
   * @param {Object} data - Données du rebut
   */
  mettreAuRebut: async (data) => {
    const response = await api.post(`${BASE_URL}/rebut`, data);
    return response.data;
  },

  /**
   * Vérifie l'éligibilité à la cession via la concertation
   * @param {number} bienId - ID du bien
   */
  verifierEligibiliteConcertation: async (bienId) => {
    const response = await api.get(`/concertations/bien/${bienId}/eligibilite/CESSION`);
    return response.data;
  },

  /**
   * Vérifie l'éligibilité au rebut via la concertation
   * @param {number} bienId - ID du bien
   */
  verifierEligibiliteRebutConcertation: async (bienId) => {
    const response = await api.get(`/concertations/bien/${bienId}/eligibilite/REBUT`);
    return response.data;
  },

  /**
   * Récupère l'éligibilité globale d'un bien (cession + rebut)
   * @param {number} bienId - ID du bien
   */
  getEligibiliteGlobale: async (bienId) => {
    const response = await api.get(`${BASE_URL}/eligibilite/${bienId}`);
    return response.data;
  },

  /**
   * Récupère les détails d'une cession par ID
   * @param {number} id - ID de la cession
   */
  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère toutes les cessions avec pagination et filtres
   * @param {Object} params - Paramètres de filtrage
   */
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, status, date_debut, date_fin, bien_id } = params;
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status && { status }),
      ...(date_debut && { date_debut }),
      ...(date_fin && { date_fin }),
      ...(bien_id && { bien_id }),
    });
    const response = await api.get(`${BASE_URL}?${queryParams}`);
    return response.data;
  },

  /**
   * Récupère les cessions d'un bien spécifique
   * @param {number} bienId - ID du bien
   */
  getByBienId: async (bienId) => {
    const response = await api.get(`${BASE_URL}/bien/${bienId}`);
    return response.data;
  },

  /**
   * Annule une cession
   * @param {number} id - ID de la cession
   * @param {string} motif - Motif d'annulation
   */
  annuler: async (id, motif) => {
    const response = await api.post(`${BASE_URL}/${id}/annuler`, { motif });
    return response.data;
  },

  /**
   * Valide une cession (DG ou Comptable)
   * @param {number} id - ID de la cession
   * @param {Object} data - Données de validation
   * @param {string} data.role_validateur - Rôle du validateur (DG, COMPTABLE)
   * @param {string} data.decision - Décision (APPROUVE, REJETE)
   * @param {string} data.commentaire - Commentaire (optionnel)
   */
  valider: async (id, data) => {
    const response = await api.post(`${BASE_URL}/${id}/valider`, data);
    return response.data;
  },

  /**
   * Refuse une cession
   * @param {number} id - ID de la cession
   * @param {string} motif - Motif du refus
   */
  refuser: async (id, motif) => {
    const response = await api.post(`${BASE_URL}/${id}/refuser`, { motif });
    return response.data;
  },

  /**
   * Récupère les statistiques des cessions
   */
  getStatistics: async () => {
    const response = await api.get(`${BASE_URL}/statistics`);
    return response.data;
  },

  /**
   * Télécharge le rapport de cession au format PDF
   * @param {number} id - ID de la cession
   */
  downloadRapport: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}/rapport`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Récupère la liste des biens éligibles à la cession
   */
  getBiensEligibles: async () => {
    const response = await api.get(`${BASE_URL}/biens-eligibles`);
    return response.data;
  },

  /**
   * Récupère la liste des biens éligibles au rebut
   */
  getBiensEligiblesRebut: async () => {
    const response = await api.get(`${BASE_URL}/biens-eligibles-rebut`);
    return response.data;
  }
};

export default cessionsService;