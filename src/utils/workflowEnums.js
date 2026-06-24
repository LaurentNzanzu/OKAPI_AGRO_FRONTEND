/** Énumérations workflow Phase 3 */

export const StatutBesoin = {
  BROUILLON: 'BROUILLON',
  EN_VALIDATION: 'EN_VALIDATION',
  DG_VALIDE: 'DG_VALIDE',
  COMPTABLE_VALIDE: 'COMPTABLE_VALIDE',
  CAISSE_VALIDE: 'CAISSE_VALIDE',
  REJETE: 'REJETE',
  APPROUVEE: 'APPROUVEE',
  ATTENTE_STOCK: 'ATTENTE_STOCK',
};

export const StatutPanne = {
  DECLAREE: 'DECLAREE',
  DIAGNOSTIQUEE: 'DIAGNOSTIQUEE',
  EN_ATTENTE_PIECES: 'EN_ATTENTE_PIECES',
  EN_VALIDATION: 'EN_VALIDATION',
  EN_COURS: 'EN_COURS',
  EN_TEST: 'EN_TEST',
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE',
};

export const EtatBien = {
  NEUF: 'NEUF',
  BON: 'BON',
  USAGE: 'USAGE',
  PANNE: 'PANNE',
  REFORME: 'REFORME',
  MAINTENANCE: 'MAINTENANCE',
  EN_TEST: 'EN_TEST',
};

export const StatutFourniture = {
  EN_ATTENTE: 'EN_ATTENTE',
  FOURNIE: 'FOURNIE',
  PARTIELLE: 'PARTIELLE',
  REFUSEE: 'REFUSEE',
  ANNULEE: 'ANNULEE',
};

const BESOIN_LABELS = {
  BROUILLON: 'Brouillon',
  EN_VALIDATION: 'En validation',
  DG_VALIDE: 'Validé DG',
  COMPTABLE_VALIDE: 'Validé comptable',
  CAISSE_VALIDE: 'Validé caisse',
  REJETE: 'Rejeté',
  APPROUVEE: 'Approuvé',
  ATTENTE_STOCK: 'En attente de stock',
};

const PANNE_LABELS = {
  DECLAREE: 'Déclarée',
  DIAGNOSTIQUEE: 'Diagnostiquée',
  EN_ATTENTE_PIECES: 'Attente pièces',
  EN_VALIDATION: 'En validation',
  EN_COURS: 'En cours',
  EN_TEST: 'En test',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

const BIEN_LABELS = {
  NEUF: 'Neuf',
  BON: 'Bon',
  USAGE: 'Usage',
  PANNE: 'En panne',
  REFORME: 'Réformé',
  MAINTENANCE: 'En maintenance',
  EN_TEST: 'En test',
};

const FOURNITURE_LABELS = {
  EN_ATTENTE: 'En attente',
  FOURNIE: 'Fournie',
  PARTIELLE: 'Partielle',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
};

export function getStatutBesoinLabel(statut) {
  return BESOIN_LABELS[statut] || statut;
}

export function getStatutPanneLabel(statut) {
  return PANNE_LABELS[statut] || statut;
}

export function getEtatBienLabel(etat) {
  return BIEN_LABELS[etat] || etat;
}

export function getStatutFournitureLabel(statut) {
  return FOURNITURE_LABELS[statut] || statut;
}

export function getStatutBesoinColor(statut) {
  switch (statut) {
    case StatutBesoin.APPROUVEE: return 'success';
    case StatutBesoin.ATTENTE_STOCK: return 'warning';
    case StatutBesoin.REJETE: return 'danger';
    case StatutBesoin.BROUILLON: return 'neutral';
    default: return 'info';
  }
}

export function getStatutPanneColor(statut) {
  switch (statut) {
    case StatutPanne.TERMINEE: return 'success';
    case StatutPanne.EN_TEST: return 'info';
    case StatutPanne.EN_COURS: return 'warning';
    case StatutPanne.ANNULEE: return 'danger';
    default: return 'neutral';
  }
}

export function getStatutFournitureColor(statut) {
  switch (statut) {
    case StatutFourniture.FOURNIE: return 'success';
    case StatutFourniture.PARTIELLE: return 'warning';
    case StatutFourniture.REFUSEE:
    case StatutFourniture.ANNULEE: return 'danger';
    default: return 'info';
  }
}

/** Classes Tailwind pour badges */
export const BADGE_COLORS = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300',
};

export function validateQuantiteFournie(qte, demandee, stock) {
  if (!Number.isInteger(qte) || qte <= 0) return 'La quantité doit être supérieure à 0';
  if (qte > demandee) return 'La quantité fournie ne peut pas dépasser la quantité demandée';
  if (qte > stock) return 'Stock disponible insuffisant';
  return null;
}
