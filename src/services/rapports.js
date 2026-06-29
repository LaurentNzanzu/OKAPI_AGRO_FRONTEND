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

// ============================================================
// NOUVEAUX SERVICES TÂCHE 3
// ============================================================

/**
 * Génère le Tableau 8 OHADA pour une année donnée
 */
export const generateTableau8 = async (annee) => {
    const response = await api.get(`/rapports/tableau-8`, { params: { annee } });
    return response.data;
};

/**
 * Récupère les projections d'investissement N+1 à N+5
 */
export const getProjections = async () => {
    const response = await api.get('/rapports/projections');
    return response.data;
};

/**
 * Récupère le journal des immobilisations d'un bien
 */
export const getJournalImmobilisations = async (bienId) => {
    const response = await api.get(`/rapports/journal-immobilisations/${bienId}`);
    return response.data;
};

/**
 * Exporte les données du Tableau 8 en CSV
 */
export const exportCSV = (data, filename) => {
    if (!data || !data.categories) {
        console.error('Données invalides pour l\'export CSV');
        return;
    }
    
    // En-têtes CSV
    let csv = 'Catégorie;Brut début;Augmentations;Diminutions;Brut fin;Amortissements cumulés;Dotations exercice;VNC fin\n';
    
    // Lignes par catégorie
    Object.entries(data.categories).forEach(([cat, vals]) => {
        csv += `${cat};${vals.brut_debut};${vals.augmentations};${vals.diminutions};${vals.brut_fin};${vals.amortissements_cumules};${vals.dotations_exercice};${vals.vnc_fin}\n`;
    });
    
    // Ligne de total
    csv += `TOTAL;${data.total_general.brut_debut};${data.total_general.augmentations};${data.total_general.diminutions};${data.total_general.brut_fin};${data.total_general.amortissements_cumules};${data.total_general.dotations_exercice};${data.total_general.vnc_fin}\n`;
    
    // Ajouter une ligne vide et les informations de cohérence
    csv += '\n';
    csv += `Cohérent avec le Grand Livre;${data.coherent ? 'OUI' : 'NON'}\n`;
    if (!data.coherent && data.ecart) {
        csv += `Écart constaté;${data.ecart}\n`;
    }
    
    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

export const exportTableau8PDF = async (annee) => {
    const response = await api.get(`/rapports/tableau-8/export-pdf`, {
        params: { annee },
        responseType: 'blob'
    });
    return response;
};

export default {
    getRapportFinancier,
    getRapportTechnique,
    getRapportAmortissements,
    getRapportFinancierOHADA,
    exportRapportOHADA,
    exporterRapport,
    generateTableau8,
    exportTableau8PDF,
    getProjections,
    getJournalImmobilisations,
    exportCSV
};