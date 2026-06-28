import api from './api';

const API_URL = '/amortissements';
const REGLES_URL = '/regles-amortissement';

export const amortissementsService = {
    // === AMORTISSEMENTS ===
    getAll: async (params) => {
        const response = await api.get(API_URL, { params });
        return response.data;
    },

    getByBien: async (bienId) => {
        const response = await api.get(`${API_URL}/bien/${bienId}`);
        return response.data;
    },

    getPlan: async (bienId) => {
        const response = await api.get(`${API_URL}/plan/${bienId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post(API_URL, data);
        return response.data;
    },

    getStatistics: async (annee) => {
        const params = annee ? { annee } : {};
        const response = await api.get(`${API_URL}/statistiques`, { params });
        return response.data;
    },

    getEcartsFiscaux: async (annee) => {
        const response = await api.get(`${API_URL}/ecarts-fiscaux`, { params: { annee } });
        return response.data;
    },

    getAmortissementComposants: async (bienId, exercice) => {
        const response = await api.get(`${API_URL}/composants/${bienId}`, { params: { exercice } });
        return response.data;
    },

    // === RÈGLES D'AMORTISSEMENT ===
    getRegles: async () => {
        const response = await api.get(REGLES_URL);
        return response.data;
    },

    getRegleByCategorie: async (categorie) => {
        const response = await api.get(`${REGLES_URL}/${categorie}`);
        return response.data;
    },

    createRegle: async (data) => {
        const response = await api.post(REGLES_URL, data);
        return response.data;
    },

    updateRegle: async (idRegle, data) => {
        const response = await api.put(`${REGLES_URL}/${idRegle}`, data);
        return response.data;
    },

    deleteRegle: async (idRegle) => {
        const response = await api.delete(`${REGLES_URL}/${idRegle}`);
        return response.data;
    },

    initialiserReglesDefault: async () => {
        const response = await api.post(`${REGLES_URL}/initialiser/defaults`);
        return response.data;
    },

    // === DÉPRÉCIATION ===
    appliquerDepreciation: async (bienId, data) => {
        const response = await api.post(`${API_URL}/${bienId}/depreciation`, data);
        return response.data;
    },

    getDepreciations: async (bienId) => {
        const response = await api.get(`${API_URL}/bien/${bienId}/depreciations`);
        return response.data;
    },

    cloturerExercice: async (exercice) => {
        const response = await api.post(`${API_URL}/cloture/${exercice}`);
        return response.data;
    },

    // === NOUVEAUX: CLÔTURE AVANCÉE ===
    cloturerExerciceAvecFiltres: async (payload) => {
        const response = await api.post(`${API_URL}/cloture-avancee`, payload);
        return response.data;
    },

    previsualiserCloture: async (params) => {
        const queryParams = new URLSearchParams();
        if (params.exercice) queryParams.set('exercice', String(params.exercice));
        if (params.categorie) queryParams.set('categorie', params.categorie);
        if (params.methode_forcee) queryParams.set('methode_forcee', params.methode_forcee);
        
        const response = await api.get(`${API_URL}/previsualisation-cloture?${queryParams}`);
        return response.data;
    },

    getDashboard: async () => {
        const response = await api.get(`${API_URL}/dashboard`);
        return response.data;
    },

    // ============================================================
    // NOUVELLES MÉTHODES POUR LA TÂCHE 2 - VALIDATION AMORTISSEMENT
    // ============================================================

    /**
     * Valide un amortissement
     * @param {number} amortissementId - ID de l'amortissement
     * @param {Object} data - Données de validation
     * @param {boolean} data.valide - True pour valider, False pour invalider
     * @param {string} data.motif - Motif si invalidation
     * @param {string} data.piece_justificative_url - URL de la pièce justificative (optionnel)
     */
    valider: async (amortissementId, data) => {
        const response = await api.post(`${API_URL}/${amortissementId}/valider`, data);
        return response.data;
    },

    /**
     * Récupère le statut de verrouillage d'un amortissement
     * @param {number} amortissementId - ID de l'amortissement
     */
    getVerrouillage: async (amortissementId) => {
        const response = await api.get(`${API_URL}/${amortissementId}/verrouillage`);
        return response.data;
    },

    /**
     * Récupère la liste des amortissements verrouillés
     * @param {number} exercice - Exercice comptable (optionnel)
     */
    getAmortissementsVerrouilles: async (exercice = null) => {
        const params = exercice ? { exercice } : {};
        const response = await api.get(`${API_URL}/verrouilles`, { params });
        return response.data;
    },

    /**
     * Récupère le statut de validation d'un amortissement
     * @param {number} amortissementId - ID de l'amortissement
     */
    getValidationStatus: async (amortissementId) => {
        const response = await api.get(`${API_URL}/${amortissementId}/validation-status`);
        return response.data;
    },

    /**
     * Vérifie la trésorerie pour un amortissement
     * @param {number} amortissementId - ID de l'amortissement
     */
    checkTresorerie: async (amortissementId) => {
        const response = await api.get(`${API_URL}/${amortissementId}/tresorerie`);
        return response.data;
    },

    /**
     * Prévisualisation détaillée de la clôture
     * @param {Object} payload - Paramètres de prévisualisation
     * @param {number} payload.exercice - Exercice comptable
     * @param {string} payload.categorie - Catégorie de bien (optionnel)
     * @param {string} payload.methode_forcee - Méthode forcée (optionnel)
     * @param {number[]} payload.biens_ids - Liste des IDs de biens (optionnel)
     */
    previsualiserClotureDetaillee: async (payload) => {
        const response = await api.post(`${API_URL}/cloture/previsualisation-detaille`, payload);
        return response.data;
    }
};

export default amortissementsService;