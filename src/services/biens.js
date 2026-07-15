// frontend/src/services/biens.js
import api from './api';

const BIENS_ENDPOINT = '/biens';

export const biensService = {
  /**
   * Récupère la liste des biens avec pagination et filtres
   * Limite maximale de sécurité fixée à 500 pour correspondre aux contraintes du backend.
   */
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, skip, type_bien, etat, search, disponible_maintenance } = params;
    
    // 🛡️ Sécurité : On s'assure que la limite demandée ne dépasse jamais la contrainte API de 500
    const safeLimit = Math.min(Number(limit), 500);
    
    // Calcul du décalage (skip) basé sur la limite sécurisée
    const skipVal = skip !== undefined ? skip : (page - 1) * safeLimit;
    
    const queryParams = new URLSearchParams({
      skip: String(skipVal),
      limit: String(safeLimit),
      ...(type_bien && { type_bien }),
      ...(etat && { etat }),
      ...(search && { search }),
      ...(disponible_maintenance !== undefined && { disponible_maintenance: String(disponible_maintenance) }),
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

  // ============================================================
  // NOUVELLES MÉTHODES POUR LA TÂCHE 2 - CESSION
  // ============================================================

  /**
   * Vérifie l'éligibilité d'un bien à la cession (4 règles)
   * @param {number} bienId - ID du bien
   */
  verifierEligibiliteCession: async (bienId) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${bienId}/cession/eligibilite`);
    return response.data;
  },

  /**
   * Récupère la liste des biens éligibles à la cession
   */
  getBiensEligiblesCession: async () => {
    const response = await api.get(`${BIENS_ENDPOINT}/eligibles-cession`);
    return response.data;
  },

  /**
   * Demande une cession pour un bien
   * @param {number} bienId - ID du bien
   * @param {Object} data - Données de la cession
   * @param {number} data.prix_vente - Prix de vente
   * @param {string} data.date_cession - Date de cession (YYYY-MM-DD)
   * @param {string} data.type_cession - Type de cession (courante, non_courante, mise_au_rebut)
   * @param {string} data.motif - Motif de la cession
   * @param {number} data.actif_remplacement_id - ID du bien de remplacement (optionnel)
   * @param {string} data.acheteur - Nom de l'acheteur (optionnel)
   * @param {string} data.mode_reglement - Mode de règlement (optionnel)
   * @param {string} data.piece_justificative_url - URL de la pièce justificative (optionnel)
   */
  demanderCession: async (bienId, data) => {
    const response = await api.post(`${BIENS_ENDPOINT}/${bienId}/cession`, data);
    return response.data;
  },

  /**
   * Récupère le statut du workflow de cession d'un bien
   * @param {number} bienId - ID du bien
   */
  getCessionWorkflow: async (bienId) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${bienId}/cession/workflow`);
    return response.data;
  },

  /**
   * Lie un bien de remplacement à un bien cédé
   * @param {number} bienCedeId - ID du bien cédé
   * @param {number} bienRemplacementId - ID du bien de remplacement
   */
  lierActifRemplacement: async (bienCedeId, bienRemplacementId) => {
    const response = await api.patch(`${BIENS_ENDPOINT}/${bienCedeId}/lier-remplacement`, {
      bien_remplacement_id: bienRemplacementId
    });
    return response.data;
  }
};

export default biensService;