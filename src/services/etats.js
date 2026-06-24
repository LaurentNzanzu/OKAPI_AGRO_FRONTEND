// frontend/src/services/etats.js
import api from './api';

/**
 * Fonction utilitaire pour déclencher le téléchargement d'un fichier blob
 */
const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Service pour la génération des états imprimables (PDF)
 */
const etatsService = {
    /**
     * Exporte la fiche détaillée d'un bien
     * @param {number} bienId - ID du bien
     * @returns {Promise<{success: boolean, filename: string}>}
     */
    getFicheBienData: async (bienId) => {
        const response = await api.get(`/etats/fiche-bien/${bienId}`, {
            params: { format: 'json' },
        });
        return response.data;
    },

    exportFicheBien: async (bienId) => {
        try {
            const response = await api.get(`/etats/fiche-bien/${bienId}`, {
                params: { format: 'pdf' },
                responseType: 'blob'
            });

            // Extraction du nom du fichier depuis Content-Disposition
            const contentDisposition = response.headers['content-disposition'];
            let filename = `fiche_bien_${bienId}.pdf`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export de la fiche bien:', error);
            // Tentative de lecture d'une erreur JSON retournée par le backend
            if (error.response && error.response.data instanceof Blob && error.response.data.type === 'application/json') {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                throw new Error(json.detail || 'Erreur serveur');
            }
            throw error;
        }
    },

    /**
     * Exporte l'inventaire complet des biens
     * @param {Object} filters - Filtres (type_bien, etat)
     * @returns {Promise<{success: boolean, filename: string}>}
     */
    exportInventaire: async (filters = {}) => {
        try {
            const response = await api.get('/etats/inventaire', {
                params: { ...filters, format: 'pdf' },
                responseType: 'blob'
            });

            let filename = 'inventaire_biens.pdf';
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export inventaire:', error);
            throw error;
        }
    },

    /**
     * Exporte un rapport de panne
     * @param {number} panneId - ID de la panne
     * @returns {Promise<{success: boolean, filename: string}>}
     */
    exportRapportPanne: async (panneId) => {
        try {
            const response = await api.get(`/etats/rapport-panne/${panneId}`, {
                params: { format: 'pdf' },
                responseType: 'blob'
            });

            let filename = `rapport_panne_${panneId}.pdf`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export rapport panne:', error);
            throw error;
        }
    },

    /**
     * Récupère les données de l'état de sortie pour aperçu / impression navigateur
     */
    getEtatBesoinData: async (besoinId) => {
        const response = await api.get(`/etats/etat-besoins/${besoinId}`, {
            params: { format: 'json' },
        });
        return response.data;
    },

    /**
     * Exporte un état de sortie pour une demande de besoin (PDF)
     * @param {number} besoinId - ID du besoin
     * @returns {Promise<{success: boolean, filename: string}>}
     */
    exportEtatBesoins: async (besoinId) => {
        try {
            const response = await api.get(`/etats/etat-besoins/${besoinId}`, {
                params: { format: 'pdf' },
                responseType: 'blob'
            });

            let filename = `etat_besoins_${besoinId}.pdf`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export état des besoins:', error);
            throw error;
        }
    },

    /**
     * Exporte l'historique des mouvements d'un bien
     * @param {number} bienId - ID du bien
     * @returns {Promise<{success: boolean, filename: string}>}
     */
    exportHistoriqueMouvements: async (bienId) => {
        try {
            const response = await api.get(`/etats/historique-mouvements/${bienId}`, {
                params: { format: 'pdf' },
                responseType: 'blob'
            });

            let filename = `historique_mouvements_${bienId}.pdf`;
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export historique mouvements:', error);
            throw error;
        }
    },

    /**
     * Exporte l'état des stocks de pièces
     * @returns {Promise<{success: boolean, filename: string}>}
     */
    exportEtatStocks: async () => {
        try {
            const response = await api.get('/etats/etat-stocks', {
                params: { format: 'pdf' },
                responseType: 'blob'
            });

            let filename = 'etat_stocks_pieces.pdf';
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export état des stocks:', error);
            throw error;
        }
    },
    getFicheAmortissementData: async (bienId) => {
        const response = await api.get(`/etats/fiche-amortissement/${bienId}`, {
            params: { format: 'json' },
        });
        return response.data;
    },

    exportFicheAmortissement: async (bienId) => {
        try {
            const response = await api.get(`/etats/fiche-amortissement/${bienId}`, {
                params: { format: 'pdf' },
                responseType: 'blob'
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = `fiche_amortissement_${bienId}.pdf`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }

            downloadBlob(response.data, filename);
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export de la fiche amortissement:', error);
            if (error.response && error.response.data instanceof Blob && error.response.data.type === 'application/json') {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                throw new Error(json.detail || 'Erreur serveur');
            }
            throw error;
        }
    },
};

export default etatsService;