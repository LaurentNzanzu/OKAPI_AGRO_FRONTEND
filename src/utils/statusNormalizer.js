/**
 * Normalisation des statuts de biens entre l'API (MAJUSCULES) et les selects MUI (minuscules).
 * Format base de données / API : NEUF, BON, USAGE, PANNE, REFORME, MAINTENANCE
 * Format selects MUI     : neuf, bon, usage, panne, reforme, maintenance
 */

import { ETAT_LABELS } from './constants';

export const ETAT_API_VALUES = Object.freeze([
  'NEUF',
  'BON',
  'USAGE',
  'PANNE',
  'REFORME',
  'MAINTENANCE',
]);

const SELECT_VALUES = new Set(
  ETAT_API_VALUES.map((value) => value.toLowerCase()),
);

/**
 * Convertit une valeur API/DB vers le format attendu par les composants Select MUI.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function normalizeStatusForSelect(value) {
  if (value == null || value === '') return '';
  const normalized = String(value).trim().toLowerCase();
  return SELECT_VALUES.has(normalized) ? normalized : '';
}

/**
 * Convertit une valeur Select MUI vers le format attendu par l'API FastAPI.
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function normalizeStatusForAPI(value) {
  if (value == null || value === '') return null;
  const upper = String(value).trim().toUpperCase();
  return ETAT_API_VALUES.includes(upper) ? upper : null;
}

/**
 * Résout une valeur d'état (API, select ou libellé FR) vers la clé API normalisée.
 */
export function resolveEtatApiKey(value) {
  if (value == null || value === '') return '';
  const selectValue = normalizeStatusForSelect(value);
  if (selectValue) return selectValue.toUpperCase();
  const lower = String(value).trim().toLowerCase();
  for (const [key, label] of Object.entries(ETAT_LABELS)) {
    if (label.toLowerCase() === lower || key === lower) {
      return key.toUpperCase();
    }
  }
  return String(value).trim().toUpperCase();
}

/**
 * Libellé lisible pour l'affichage (tolère majuscules et minuscules).
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function normalizeStatusForDisplay(value) {
  if (value == null || value === '') return '—';
  const selectKey = normalizeStatusForSelect(value);
  if (selectKey && ETAT_LABELS[selectKey]) {
    return ETAT_LABELS[selectKey];
  }
  return String(value);
}

/**
 * Options prêtes pour un Select MUI (valeurs en minuscules).
 */
export function getEtatSelectOptions() {
  return ETAT_API_VALUES.map((apiValue) => {
    const selectValue = apiValue.toLowerCase();
    return {
      value: selectValue,
      label: ETAT_LABELS[selectValue] || apiValue,
    };
  });
}
