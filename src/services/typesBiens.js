// frontend/src/services/typesBiens.js
import api from './api';

const TYPES_BIENS_ENDPOINT = '/types-biens';

export const typesBiensService = {
  // ============================================================
  // MÉTHODES CRUD PRINCIPALES
  // ============================================================

  /**
   * Récupère la liste des types de biens avec pagination et filtres
   * @param {Object} params - Paramètres de filtrage
   * @param {number} params.skip - Nombre d'éléments à sauter
   * @param {number} params.limit - Nombre d'éléments par page (max 500)
   * @param {boolean} params.est_actif - Filtrer par statut actif/inactif
   * @param {string} params.search - Recherche par libellé ou code
   * @returns {Promise<Object>} { total, page, page_size, types }
   */
  getAll: async (params = {}) => {
    const { skip = 0, limit = 25, est_actif, search } = params;

    // 🛡️ Sécurité : On s'assure que la limite demandée ne dépasse jamais la contrainte API de 500
    const safeLimit = Math.min(Number(limit), 500);

    const queryParams = new URLSearchParams({
      skip: String(skip),
      limit: String(safeLimit),
      ...(est_actif !== undefined && est_actif !== null && { est_actif: String(est_actif) }),
      ...(search && { search: search.trim() }),
    });

    const response = await api.get(`${TYPES_BIENS_ENDPOINT}?${queryParams}`);
    return response.data;
  },

  /**
   * Récupère tous les types de biens actifs (sans pagination)
   * Utilisé pour les listes déroulantes du frontend
   * @param {number} limit - Nombre maximum de résultats (défaut: 1000)
   * @returns {Promise<Array>} Liste des types de biens actifs
   */
  getAllActifs: async (limit = 1000) => {
    // Utiliser l'endpoint /all pour récupérer tous les types actifs
    const response = await api.get(`${TYPES_BIENS_ENDPOINT}/all`, {
      params: { limit: Math.min(limit, 1000) }
    });
    return response.data;
  },

  /**
   * Récupère un type de bien par son ID
   * @param {number} id - ID du type de bien
   * @returns {Promise<Object>} Type de bien
   */
  getById: async (id) => {
    const response = await api.get(`${TYPES_BIENS_ENDPOINT}/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau type de bien
   * @param {Object} data - Données du type de bien
   * @param {string} data.libelle - Libellé du type
   * @param {string} data.code - Code unique (ex: VEHICULE)
   * @param {string} data.compte_comptable - Compte comptable (défaut: 2440)
   * @param {Array} data.champs_specifiques - Liste des champs spécifiques
   * @param {string} data.description - Description (optionnel)
   * @param {boolean} data.est_actif - Statut (défaut: true)
   * @returns {Promise<Object>} Type de bien créé
   */
  create: async (data) => {
    const response = await api.post(TYPES_BIENS_ENDPOINT, data);
    return response.data;
  },

  /**
   * Met à jour un type de bien
   * @param {number} id - ID du type de bien
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Type de bien mis à jour
   */
  update: async (id, data) => {
    const response = await api.put(`${TYPES_BIENS_ENDPOINT}/${id}`, data);
    return response.data;
  },

  /**
   * Supprime (désactive) un type de bien
   * @param {number} id - ID du type de bien
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    await api.delete(`${TYPES_BIENS_ENDPOINT}/${id}`);
  },

  // ============================================================
  // MÉTHODES POUR LES CHAMPS SPÉCIFIQUES
  // ============================================================

  /**
   * Récupère les champs spécifiques d'un type de bien
   * Utilisé par le frontend pour générer le formulaire dynamique
   * @param {number} typeId - ID du type de bien
   * @returns {Promise<Array>} Liste des champs spécifiques
   */
  getChampsSpecifiques: async (typeId) => {
    const response = await api.get(`${TYPES_BIENS_ENDPOINT}/${typeId}/champs`);
    return response.data;
  },

  /**
   * Ajoute un champ spécifique à un type de bien
   * @param {number} typeId - ID du type de bien
   * @param {Object} champ - Données du champ
   * @param {string} champ.nom - Nom du champ
   * @param {string} champ.type - Type du champ (text, number, date, select, boolean, textarea, email, tel)
   * @param {boolean} champ.obligatoire - Champ obligatoire ou non
   * @param {Array} champ.options - Options pour le type 'select'
   * @param {*} champ.valeur_par_defaut - Valeur par défaut
   * @param {string} champ.aide - Texte d'aide
   * @returns {Promise<Object>} Type de bien mis à jour
   */
  ajouterChamp: async (typeId, champ) => {
    const response = await api.post(`${TYPES_BIENS_ENDPOINT}/${typeId}/champs`, champ);
    return response.data;
  },

  /**
   * Supprime un champ spécifique d'un type de bien
   * @param {number} typeId - ID du type de bien
   * @param {string} champNom - Nom du champ à supprimer
   * @returns {Promise<Object>} Type de bien mis à jour
   */
  supprimerChamp: async (typeId, champNom) => {
    const response = await api.delete(`${TYPES_BIENS_ENDPOINT}/${typeId}/champs/${encodeURIComponent(champNom)}`);
    return response.data;
  },

  // ============================================================
  // MÉTHODES UTILITAIRES
  // ============================================================

  /**
   * Vérifie si un type de bien est utilisé par des biens existants
   * @param {number} typeId - ID du type de bien
   * @returns {Promise<boolean>} true si utilisé, false sinon
   */
  isUsedByBiens: async (typeId) => {
    try {
      // On récupère le type et on vérifie s'il a des biens associés
      const type = await typesBiensService.getById(typeId);
      // Le backend peut retourner un champ 'nb_biens' ou 'est_utilise'
      // Si le champ n'existe pas, on considère que le type peut être utilisé
      return type.nb_biens > 0 || type.est_utilise === true;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'utilisation:', error);
      return false;
    }
  },

  /**
   * Récupère les types de biens par catégorie
   * @param {string} category - Catégorie (ex: VEHICULE, MACHINE, ORDINATEUR)
   * @returns {Promise<Array>} Liste des types de biens de la catégorie
   */
  getByCategory: async (category) => {
    // Si le backend supporte le filtrage par catégorie
    // Sinon, on filtre côté client
    const types = await typesBiensService.getAllActifs();
    return types.filter(type => type.code?.toUpperCase().includes(category.toUpperCase()));
  },

  /**
   * Récupère les options de champs pour un type de bien
   * Format adapté pour les composants de formulaire
   * @param {number} typeId - ID du type de bien
   * @returns {Promise<Array>} Liste des champs formatés pour les formulaires
   */
  getFieldOptionsForType: async (typeId) => {
    const champs = await typesBiensService.getChampsSpecifiques(typeId);
    return champs.map(champ => ({
      name: champ.nom,
      label: champ.label || champ.nom,
      type: champ.type || 'text',
      required: champ.obligatoire || false,
      options: champ.options || [],
      defaultValue: champ.valeur_par_defaut || null,
      help: champ.aide || null,
    }));
  },

  /**
   * Récupère les types de biens avec leurs champs spécifiques
   * Utile pour le préchargement des données de formulaire
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Promise<Array>} Liste des types avec leurs champs
   */
  getAllWithFields: async (limit = 100) => {
    const response = await api.get(`${TYPES_BIENS_ENDPOINT}`, {
      params: { limit: Math.min(limit, 100), est_actif: true }
    });
    return response.data.types || [];
  },

  /**
   * Valide un ensemble de champs spécifiques selon les règles du type
   * @param {number} typeId - ID du type de bien
   * @param {Object} valeurs - Valeurs des champs à valider
   * @returns {Promise<Object>} Résultat de la validation { valid, errors }
   */
  validerChamps: async (typeId, valeurs) => {
    const champs = await typesBiensService.getChampsSpecifiques(typeId);
    const errors = {};

    champs.forEach(champ => {
      const valeur = valeurs[champ.nom];

      // Validation des champs obligatoires
      if (champ.obligatoire) {
        if (valeur === undefined || valeur === null || valeur === '') {
          errors[champ.nom] = `Le champ "${champ.nom}" est obligatoire`;
          return;
        }
        if (champ.type === 'boolean' && (valeur === undefined || valeur === null)) {
          errors[champ.nom] = `Le champ "${champ.nom}" est obligatoire`;
          return;
        }
      }

      // Validation du type
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        switch (champ.type) {
          case 'number':
            if (isNaN(Number(valeur))) {
              errors[champ.nom] = `Le champ "${champ.nom}" doit être un nombre`;
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur)) {
              errors[champ.nom] = `Le champ "${champ.nom}" doit être un email valide`;
            }
            break;
          case 'select':
            if (champ.options && !champ.options.includes(valeur)) {
              errors[champ.nom] = `La valeur "${valeur}" n'est pas valide pour ce champ`;
            }
            break;
          case 'date':
            if (isNaN(Date.parse(valeur))) {
              errors[champ.nom] = `Le champ "${champ.nom}" doit être une date valide`;
            }
            break;
          default:
            break;
        }
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default typesBiensService;