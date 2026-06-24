// frontend/src/services/biens.js
import api from './api';

const BIENS_ENDPOINT = '/biens';

export const biensService = {
  /**
   * Récupère la liste des biens avec pagination et filtres
   */
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, type_bien, etat, search } = params;
    const queryParams = new URLSearchParams({
      skip: String((page - 1) * limit),
      limit: String(limit),
      ...(type_bien && { type_bien }),
      ...(etat && { etat }),
      ...(search && { search }),
    });

    const response = await api.get(`${BIENS_ENDPOINT}?${queryParams}`);
    return response.data;
  },

  /**
   * Récupère un bien par son ID avec option de contexte panne
   */
  getById: async (id, options = {}) => {
    const queryParams = new URLSearchParams();
    if (options.panneId != null) {
      queryParams.set('panne_id', String(options.panneId));
    }
    const query = queryParams.toString();
    const url = query ? `${BIENS_ENDPOINT}/${id}?${query}` : `${BIENS_ENDPOINT}/${id}`;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Crée un nouveau bien avec génération automatique de l'écriture comptable
   * @param {Object} bienData - Données du bien
   * @param {string} bienData.type_bien - Type de bien (vehicule, machine, ordinateur)
   * @param {string} bienData.date_acquisition - Date d'acquisition (YYYY-MM-DD)
   * @param {number} bienData.prix_acquisition - Prix d'acquisition
   * @param {string} bienData.mode_paiement - Mode de paiement (credit ou comptant)
   * @param {number} bienData.fournisseur_id - ID du fournisseur (requis si mode_paiement=credit)
   * @param {string} bienData.devise - Devise (FCFA, CDF, USD, EUR)
   * @param {string} bienData.etat - État du bien (NEUF, BON, USAGE, etc.)
   * @param {string} bienData.localisation - Localisation
   * @param {string} bienData.description - Description
   */
  create: async (bienData) => {
    const response = await api.post(BIENS_ENDPOINT, bienData);
    return response.data;
  },

  /**
   * Met à jour un bien existant
   */
  update: async (id, bienData) => {
    const response = await api.put(`${BIENS_ENDPOINT}/${id}`, bienData);
    return response.data;
  },

  /**
   * Supprime un bien
   */
  delete: async (id) => {
    await api.delete(`${BIENS_ENDPOINT}/${id}`);
  },

  /**
   * Génère un QR code pour un bien
   */
  generateQRCode: async (id) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${id}/qr-code`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Met à jour l'état d'un bien
   */
  updateEtat: async (id, nouvelEtat) => {
    const response = await api.patch(`${BIENS_ENDPOINT}/${id}/etat`, null, {
      params: { nouvel_etat: nouvelEtat },
    });
    return response.data;
  },

  /**
   * Récupère les statistiques des biens
   */
  getStatistics: async () => {
    const response = await api.get(`${BIENS_ENDPOINT}/statistics/summary`);
    return response.data;
  },

  /**
   * Récupère l'âge d'un bien en années
   */
  getAge: async (id) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${id}/age`);
    return response.data;
  },
};

export default biensService;