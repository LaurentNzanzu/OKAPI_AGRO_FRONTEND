// frontend/src/utils/statutHelpers.js

/**
 * Couleurs associées à chaque statut comptable
 */
export const STATUT_COLORS = {
    ACTIF: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    EN_AMORTISSEMENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    EN_DEPRECIATION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    CEDE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    MIS_AU_REBUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
};

/**
 * Icônes associées à chaque statut comptable
 */
export const STATUT_ICONS = {
    ACTIF: 'CheckCircleIcon',
    EN_AMORTISSEMENT: 'PlayIcon',
    EN_DEPRECIATION: 'ExclamationTriangleIcon',
    CEDE: 'XCircleIcon',
    MIS_AU_REBUT: 'TrashIcon'
};

/**
 * Libellés des statuts
 */
export const getStatutLabel = (statut, t) => {
    const labels = {
        ACTIF: t('statuts.actif', 'ACTIF'),
        EN_AMORTISSEMENT: t('statuts.enAmortissement', 'EN AMORTISSEMENT'),
        EN_DEPRECIATION: t('statuts.enDepreciation', 'EN DÉPRÉCIATION'),
        CEDE: t('statuts.cede', 'CÉDÉ'),
        MIS_AU_REBUT: t('statuts.misAuRebut', 'MIS AU REBUT')
    };
    return labels[statut] || statut;
};

/**
 * Vérifie si le bien est actif (pas sorti)
 */
export const isStatutActif = (statut) => {
    return statut === 'ACTIF' || statut === 'EN_AMORTISSEMENT' || statut === 'EN_DEPRECIATION';
};

/**
 * Vérifie si le bien est sorti du parc
 */
export const isStatutSortie = (statut) => {
    return statut === 'CEDE' || statut === 'MIS_AU_REBUT';
};

/**
 * Vérifie si l'amortissement est autorisé
 */
export const peutAmortir = (statut) => {
    return statut === 'ACTIF' || statut === 'EN_AMORTISSEMENT' || statut === 'EN_DEPRECIATION';
};

/**
 * Vérifie si la dépréciation est autorisée
 */
export const peutDeprecier = (statut) => {
    return statut === 'ACTIF' || statut === 'EN_AMORTISSEMENT';
};

/**
 * Vérifie si la reprise de dépréciation est autorisée
 */
export const peutReprendre = (statut) => {
    return statut === 'EN_DEPRECIATION';
};

/**
 * Vérifie si la cession est autorisée
 */
export const peutCeder = (statut) => {
    return statut !== 'CEDE' && statut !== 'MIS_AU_REBUT';
};

/**
 * Vérifie si la mise au rebut est autorisée
 */
export const peutMettreAuRebut = (statut) => {
    return statut !== 'CEDE' && statut !== 'MIS_AU_REBUT';
};