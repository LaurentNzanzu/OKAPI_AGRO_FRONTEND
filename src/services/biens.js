// frontend/src/services/biens.js
import api from './api';

const BIENS_ENDPOINT = '/biens';

export const biensService = {
  /**
   * Récupère la liste des biens avec pagination et filtres
   */
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, skip, type_bien, etat, search, disponible_maintenance } = params;

    const safeLimit = Math.min(Number(limit), 500);
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
   * Crée un bien avec les métadonnées d'images (URLs provenant de Cloudinary)
   * IMPORTANT : Nous n'envoyons plus de fichiers ici, juste des données JSON.
   */
  createWithImages: async (data) => {
    // 'data' est un objet JSON contenant : { titre, prix, ..., images: [{url, public_id}, ...] }
    const response = await api.post('/biens/with-images', data);
    return response.data;
  },

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

  create: async (bienData) => {
    const response = await api.post(BIENS_ENDPOINT, bienData);
    return response.data;
  },

  update: async (id, bienData) => {
    const response = await api.put(`${BIENS_ENDPOINT}/${id}`, bienData);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`${BIENS_ENDPOINT}/${id}`);
  },

  generateQRCode: async (id) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${id}/qr-code`, {
      responseType: 'blob',
    });
    return response.data;
  },

  updateEtat: async (id, nouvelEtat) => {
    const response = await api.patch(`${BIENS_ENDPOINT}/${id}/etat`, null, {
      params: { nouvel_etat: nouvelEtat },
    });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get(`${BIENS_ENDPOINT}/statistics/summary`);
    return response.data;
  },

  getAge: async (id) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${id}/age`);
    return response.data;
  },

  // ============================================================
  // MÉTHODES POUR LA CONCERTATION
  // ============================================================
  verifierEligibiliteCessionEtRebut: async (bienId) => {
    const response = await api.get(`/concertations/bien/${bienId}/eligibilite/cession`);
    const cession = response.data;

    const responseRebut = await api.get(`/concertations/bien/${bienId}/eligibilite/rebut`);
    const rebut = responseRebut.data;

    return {
      cession: {
        eligible: cession.eligible || false,
        validation_dg: cession.validation_dg || false,
        validation_comptable: cession.validation_comptable || false,
        raison: cession.raison || 'Validation double en attente'
      },
      rebut: {
        eligible: rebut.eligible || false,
        validation_dg: rebut.validation_dg || false,
        validation_comptable: rebut.validation_comptable || false,
        diagnostic_irrecuperable: rebut.diagnostic_irrecuperable || false,
        raison: rebut.raison || 'Validation double en attente'
      }
    };
  },

  verifierEligibiliteCession: async (bienId) => {
    const response = await api.get(`/concertations/bien/${bienId}/eligibilite/CESSION`);
    return response.data;
  },

  verifierEligibiliteRebut: async (bienId) => {
    const response = await api.get(`/concertations/bien/${bienId}/eligibilite/REBUT`);
    return response.data;
  },

  verifierEligibiliteCessionMetier: async (bienId) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${bienId}/cession/eligibilite`);
    return response.data;
  },

  demanderCession: async (bienId, data) => {
    const response = await api.post(`${BIENS_ENDPOINT}/${bienId}/cession`, data);
    return response.data;
  },

  demanderRebut: async (bienId, data) => {
    const response = await api.post(`${BIENS_ENDPOINT}/${bienId}/rebut`, data);
    return response.data;
  },

  getCessionWorkflow: async (bienId) => {
    const response = await api.get(`${BIENS_ENDPOINT}/${bienId}/cession/workflow`);
    return response.data;
  },

  getConcertations: async (bienId, typeValidation = null) => {
    const url = typeValidation
      ? `/concertations/bien/${bienId}?type_validation=${typeValidation}`
      : `/concertations/bien/${bienId}`;
    const response = await api.get(url);
    return response.data;
  },

  lierActifRemplacement: async (bienCedeId, bienRemplacementId) => {
    const response = await api.patch(`${BIENS_ENDPOINT}/${bienCedeId}/lier-remplacement`, {
      bien_remplacement_id: bienRemplacementId
    });
    return response.data;
  }
};

export default biensService;