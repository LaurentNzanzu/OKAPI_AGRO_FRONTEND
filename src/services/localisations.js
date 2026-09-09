// frontend/src/services/localisations.js
import api from './api';

const BASE_URL = '/localisations';

export const localisationsService = {
  /**
   * Récupère la liste des localisations avec pagination
   * @param {Object} params - Paramètres de pagination
   * @param {number} params.skip - Nombre d'éléments à sauter
   * @param {number} params.limit - Nombre d'éléments par page
   * @param {string} params.search - Recherche (optionnel)
   * @param {boolean} params.est_actif - Filtrer par statut actif (optionnel)
   * @returns {Promise<Array>} Liste des localisations
   */
  getAll: async (params = {}) => {
    const { skip = 0, limit = 500, search, est_actif } = params;
    const queryParams = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });
    if (search) {
      queryParams.append('search', search);
    }
    if (est_actif !== undefined && est_actif !== null) {
      queryParams.append('est_actif', String(est_actif));
    }
    
    const response = await api.get(`${BASE_URL}?${queryParams}`);
    const data = response.data;
    
    // L'API retourne { total, localisations: [...] }
    // On retourne TOUJOURS un tableau pour simplifier l'usage côté composants
    if (Array.isArray(data)) {
      return data;
    }
    if (data?.localisations && Array.isArray(data.localisations)) {
      return data.localisations;
    }
    // Fallback : autres noms de propriétés possibles
    const items = data?.items || data?.data || data?.results;
    if (Array.isArray(items)) {
      return items;
    }
    console.warn('[localisationsService.getAll] Structure API inattendue :', data);
    return [];
  },

  /**
   * Récupère toutes les localisations (sans pagination)
   * Utilisé pour les listes déroulantes
   * @returns {Promise<Array>} Liste de toutes les localisations
   */
  getAllActifs: async () => {
    const response = await api.get(`${BASE_URL}/all`);
    // Même logique de sécurité
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.localisations || data?.items || data?.data || data?.results || [];
  },

  /**
   * Crée une nouvelle localisation
   * @param {Object} data - Données de la localisation
   * @param {string} data.nom_localisation - Nom de la localisation
   * @returns {Promise<Object>} Localisation créée
   */
  create: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  /**
   * Récupère une localisation par son ID
   * @param {number} id - ID de la localisation
   * @returns {Promise<Object>} Localisation
   */
  getById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Met à jour une localisation
   * @param {number} id - ID de la localisation
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Localisation mise à jour
   */
  update: async (id, data) => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Supprime une localisation
   * @param {number} id - ID de la localisation
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default localisationsService;