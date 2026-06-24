import api from './api';

const BASE_URL = '/mouvements';

export const mouvementsService = {
    /**
     * Créer un nouveau mouvement
     * @param {Object} data - Données du mouvement (sans id_utilisateur)
     */
    create: async (data) => {
        const response = await api.post(BASE_URL, data);
        return response.data;
    },

    /**
     * Récupérer l'historique d'un bien spécifique
     * @param {number} idBien - ID du bien
     * @param {Object} params - Pagination
     */
    getByBien: async (idBien, params = {}) => {
        const response = await api.get(`${BASE_URL}/bien/${idBien}`, { params });
        return response.data;
    },

    /**
     * Lister tous les mouvements avec filtres
     * @param {Object} filters - Filtres optionnels
     */
    getAll: async (filters = {}) => {
        const params = {};
        if (filters.page) params.skip = (filters.page - 1) * (filters.limit || 10);
        if (filters.limit) params.limit = filters.limit;
        if (filters.type) params.type_mouvement = filters.type;
        if (filters.dateDebut) params.date_debut = filters.dateDebut;
        if (filters.dateFin) params.date_fin = filters.dateFin;
        if (filters.idBien) params.id_bien = filters.idBien;
        
        const response = await api.get(BASE_URL, { params });
        return response.data;
    },

    /**
     * Récupérer un mouvement par ID
     * @param {number} id - ID du mouvement
     */
    getById: async (id) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Mettre à jour un mouvement
     * @param {number} id - ID du mouvement
     * @param {Object} data - Données à mettre à jour
     */
    update: async (id, data) => {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    /**
     * Statistiques des mouvements
     * @param {number|null} annee - Année optionnelle
     */
    getStatistiques: async (annee = null) => {
        const params = annee ? { annee } : {};
        const response = await api.get(`${BASE_URL}/statistiques`, { params });
        return response.data;
    }
};

export default mouvementsService;