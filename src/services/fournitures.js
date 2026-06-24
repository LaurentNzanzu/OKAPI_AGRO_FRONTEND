import api from './api';

const BASE_URL = '/fournitures';

const handleError = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  if (status === 403) throw new Error('Permissions insuffisantes');
  if (status === 404) throw new Error('Demande de fourniture introuvable');
  if (status === 400) throw new Error(detail || 'Requête invalide');
  throw new Error(detail || 'Erreur lors de la communication avec le serveur');
};

/** @typedef {import('axios').AxiosError} AxiosError */

export const fournituresService = {
  /** @returns {Promise<Array>} */
  getEnAttente: async () => {
    try {
      const response = await api.get(`${BASE_URL}/en-attente`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /** @param {number} besoinId */
  getByBesoin: async (besoinId) => {
    try {
      const response = await api.get(`${BASE_URL}/besoin/${besoinId}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /**
   * @param {number} idFourniture
   * @param {number} quantiteFournie
   * @param {string} [commentaire]
   */
  valider: async (idFourniture, quantiteFournie, commentaire = null) => {
    try {
      const body = { quantite_fournie: quantiteFournie };
      if (commentaire) body.commentaire = commentaire;
      const response = await api.post(`${BASE_URL}/${idFourniture}/valider`, body);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  /** @param {number} idFourniture @param {string} commentaire */
  refuser: async (idFourniture, commentaire) => {
    try {
      const response = await api.post(`${BASE_URL}/${idFourniture}/refuser`, { commentaire });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getStatistiques: async () => {
    try {
      const response = await api.get(`${BASE_URL}/statistiques`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },
};
