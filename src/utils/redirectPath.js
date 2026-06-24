/**
 * Vérifie qu'un chemin correspond à une route déclarée dans l'application.
 * Utilisé après connexion et pour la navigation depuis les notifications.
 */

const STATIC_PATHS = new Set([
  '/',
  '/dashboard',
  '/scan',
  '/utilisateurs',
  '/utilisateurs/permissions',
  '/biens',
  '/biens/nouveau',
  '/pannes',
  '/pannes/declarer',
  '/pannes/mes-pannes',
  '/pieces',
  '/pieces/catalogue',
  '/pieces/stock',
  '/fournitures/en-attente',
  '/besoins/nouveau',
  '/besoins/attente-stock',
  '/maintenances',
  '/maintenances/planning',
  '/maintenances/nouveau',
  '/maintenances/liste',
  '/maintenances/alertes',
  '/maintenances/mes-maintenances',
  '/maintenances/a-venir',
  '/maintenances/en-retard',
  '/maintenances/planifier',
  '/validations',
  '/validations/historique',
  '/amortissements',
  '/amortissements/nouveau',
  '/amortissements/ecritures',
  '/amortissements/regles',
  '/cessions/nouveau',
  '/rebut/nouveau',
  '/mouvements',
  '/mouvements/liste',
  '/mouvements/historique',
  '/mouvements/nouveau',
  '/notifications',
  '/audit/journal',
  '/rapports',
  '/rapports/financiers',
  '/rapports/techniques',
  '/rapports/amortissements',
  '/ia/aide-decision',
  '/ia/alertes-achat',
  '/ia/assistant',
  '/profil',
  '/parametres',
]);

const DYNAMIC_PATTERNS = [
  /^\/biens\/\d+$/,
  /^\/biens\/\d+\/edit$/,
  /^\/biens\/\d+\/amortissements$/,
  /^\/pannes\/\d+$/,
  /^\/pannes\/\d+\/pieces$/,
  /^\/pannes\/\d+\/tester$/,
  /^\/besoins\/\d+$/,
  /^\/fournitures\/valider\/\d+$/,
  /^\/maintenances\/\d+$/,
  /^\/maintenances\/\d+\/modifier$/,
  /^\/validations\/\d+$/,
  /^\/amortissements\/fiche\/\d+$/,
  /^\/amortissements\/tableau\/\d+$/,
  /^\/mouvements\/\d+$/,
  /^\/mouvements\/bien\/\d+$/,
  /^\/pieces\/\d+$/,
  /^\/ia\/health-score\/\d+$/,
  /^\/prints\/fiche-bien\/\d+$/,
  /^\/prints\/fiche-amortissement\/\d+$/,
  /^\/prints\/etat-besoin\/\d+$/,
];

export function normalizePathname(pathname) {
  if (!pathname || typeof pathname !== 'string') return '';
  const base = pathname.split('?')[0].split('#')[0].trim();
  if (!base.startsWith('/')) return '';
  if (base.length > 1 && base.endsWith('/')) return base.slice(0, -1);
  return base || '/';
}

export function isValidAppPath(pathname) {
  const path = normalizePathname(pathname);
  if (!path) return false;
  if (STATIC_PATHS.has(path)) return true;
  return DYNAMIC_PATTERNS.some((pattern) => pattern.test(path));
}

export function getSafeRedirectPath(pathname, fallback = '/dashboard') {
  if (!pathname || typeof pathname !== 'string') return fallback;

  const trimmed = pathname.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.toLowerCase().startsWith('javascript:')
  ) {
    return fallback;
  }

  const pathOnly = normalizePathname(trimmed);
  if (!pathOnly) return fallback;

  if (isValidAppPath(pathOnly)) {
    const query = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?')) : '';
    return `${pathOnly}${query}`;
  }

  if (import.meta.env.DEV) {
    console.warn(`Redirection sécurisée vers ${fallback} (chemin inconnu: ${pathname})`);
  }
  return fallback;
}

export default getSafeRedirectPath;
