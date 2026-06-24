// frontend/src/services/fournisseurs.js
import api from './api';

const FOURNISSEURS_ENDPOINT = '/fournisseurs';

export const fournisseursService = {
  /**
   * Récupère la liste des fournisseurs avec pagination et recherche
   * @param {Object} params
   * @param {string} params.search - Terme de recherche (nom)
   * @param {number} params.skip - Nombre d'éléments à sauter
   * @param {number} params.limit - Nombre d'éléments à récupérer
   */
  getAll: async (params = {}) => {
    const { search, skip = 0, limit = 50 } = params;
    const queryParams = new URLSearchParams();
    
    // Ne pas inclure les paramètres vides
    if (skip > 0) queryParams.set('skip', String(skip));
    queryParams.set('limit', String(limit));
    if (search) queryParams.set('search', search);
    
    const query = queryParams.toString();
    const url = query ? `${FOURNISSEURS_ENDPOINT}?${query}` : FOURNISSEURS_ENDPOINT;
    
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Récupère un fournisseur par son ID
   */
  getById: async (id) => {
    const response = await api.get(`${FOURNISSEURS_ENDPOINT}/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau fournisseur
   * @param {Object} data
   * @param {string} data.nom - Nom du fournisseur (obligatoire)
   * @param {string} data.adresse - Adresse
   * @param {string} data.telephone - Téléphone
   * @param {string} data.email - Email
   * @param {string} data.numero_contribuable - Numéro de contribuable
   */
  create: async (data) => {
    const response = await api.post(FOURNISSEURS_ENDPOINT, data);
    return response.data;
  },

  /**
   * Met à jour un fournisseur
   */
  update: async (id, data) => {
    const response = await api.put(`${FOURNISSEURS_ENDPOINT}/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un fournisseur
   */
  delete: async (id) => {
    await api.delete(`${FOURNISSEURS_ENDPOINT}/${id}`);
  },

  /**
   * Recherche rapide des fournisseurs (utile pour l'autocomplétion)
   * @param {string} searchTerm - Terme de recherche
   * @param {number} limit - Nombre de résultats max
   */
  search: async (searchTerm, limit = 10) => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }
    const response = await api.get(`${FOURNISSEURS_ENDPOINT}?search=${encodeURIComponent(searchTerm)}&limit=${limit}`);
    return response.data;
  },
};

export default fournisseursService;