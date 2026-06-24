// frontend/src/services/rapports.js
import api from './api';

/**
 * Récupère le rapport financier pour affichage web
 */
export const getRapportFinancier = async (dateDebut, dateFin) => {
    const params = new URLSearchParams({
        date_debut: dateDebut,
        date_fin: dateFin,
    });
    const response = await api.get(`/rapports/financier?${params}`);
    return response.data;
};

/**
 * Récupère le rapport technique pour affichage web
 */
export const getRapportTechnique = async (dateDebut, dateFin) => {
    const params = new URLSearchParams({
        date_debut: dateDebut,
        date_fin: dateFin,
    });
    const response = await api.get(`/rapports/technique?${params}`);
    return response.data;
};

/**
 * Récupère le rapport des amortissements pour affichage web
 */
export const getRapportAmortissements = async (annee) => {
    const params = new URLSearchParams({
        annee: annee,
    });
    const response = await api.get(`/rapports/amortissements?${params}`);
    return response.data;
};

/**
 * Récupère le rapport financier complet conforme OHADA
 */
export const getRapportFinancierOHADA = async (dateDebut, dateFin, exercice = null) => {
    const params = new URLSearchParams({
        date_debut: dateDebut,
        date_fin: dateFin,
    });
    if (exercice) {
        params.set('exercice', String(exercice));
    }
    const response = await api.get(`/rapports/financier-ohada?${params}`);
    return response.data;
};

/**
 * Exporte le rapport financier OHADA en PDF ou Excel
 */
export const exportRapportOHADA = async (format, dateDebut, dateFin, exercice = null) => {
    const params = new URLSearchParams({
        format: format,
        date_debut: dateDebut,
        date_fin: dateFin,
    });
    if (exercice) {
        params.set('exercice', String(exercice));
    }
    const response = await api.get(`/rapports/export/ohada?${params}`, {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Exporte un rapport au format PDF, Excel ou CSV
 * @param {string} typeRapport - 'financier', 'technique', 'amortissements'
 * @param {string} format - 'pdf', 'excel', 'csv'
 * @param {Object} params - { dateDebut, dateFin } ou { annee }
 */
export const exporterRapport = async (typeRapport, format, params) => {
    let queryParams = { type_rapport: typeRapport, format };
    
    if (params.dateDebut && params.dateFin) {
        queryParams.date_debut = params.dateDebut;
        queryParams.date_fin = params.dateFin;
    }
    if (params.annee) {
        queryParams.annee = params.annee;
    }
    
    const response = await api.get('/rapports/export', {
        params: queryParams,
        responseType: 'blob'  // Important pour les fichiers
    });
    
    // Créer un lien de téléchargement
    const contentDisposition = response.headers['content-disposition'];
    let filename = `rapport_${typeRapport}_${Date.now()}`;
    
    if (contentDisposition) {
        const match = contentDisposition.match(/filename=(.+)/);
        if (match && match[1]) {
            filename = match[1];
        }
    } else {
        const extension = format === 'pdf' ? 'pdf' : (format === 'excel' ? 'xlsx' : 'csv');
        filename = `rapport_${typeRapport}_${Date.now()}.${extension}`;
    }
    
    // Télécharger le fichier
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
};

export default {
    getRapportFinancier,
    getRapportTechnique,
    getRapportAmortissements,
    getRapportFinancierOHADA,
    exportRapportOHADA,
    exporterRapport
};