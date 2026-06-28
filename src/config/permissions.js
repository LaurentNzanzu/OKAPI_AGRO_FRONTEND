// frontend/src/config/permissions.js

/**
 * Permissions par rôle — affichage frontend et garde de routes.
 * Les clés correspondent aux permissions métier décrites dans le cahier des charges.
 */

export const ROLE_PERMISSIONS = {
  ADMIN: [
    '*',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'users.permissions.manage',
    'settings.view',
    'settings.manage',
    // ✅ Plan comptable
    'plan_comptable.view',
    'plan_comptable.create',
    'plan_comptable.update',
    'plan_comptable.delete',
  ],
  DG: [
    'dashboard.view',
    'biens.view',
    'biens.view.financial',
    'biens.inventory',
    'pannes.view',
    'pannes.urgent.view',
    'maintenances.view',
    'validations.view',
    'besoins.attente_stock.view',
    'ia.view',
    'amortissements.view',
    'amortissements.biens_totalement_amortis.view',
    'rapports.view',
    'rapports.financiers.view',
    'rapports.techniques.view',
    'rapports.amortissements.view',
    'rapports.export',
    'notifications.view',
    'notifications.history.view',
    'audit.view',
    'biens.sortie.validate',
    'maintenance.budget.final_validate',
    // ✅ Plan comptable - Consultation uniquement
    'plan_comptable.view',
  ],
  COMPTABLE: [
    'dashboard.view',
    'biens.view',
    'biens.view.financial',
    'biens.inventory',
    'biens.create',
    'biens.update',
    'biens.validate',
    'biens.reject',
    'amortissements.view',
    'amortissements.generate',
    'amortissements.update',
    'amortissements.reports',
    'amortissements.ecritures',
    'amortissements.biens_totalement_amortis.view',
    'validations.view',
    'validations.validate',
    'maintenance.budget.view',
    'maintenance.budget.validate',
    'maintenance.budget.reject',
    'rapports.view',
    'rapports.financiers.view',
    'rapports.amortissements.view',
    'rapports.export',
    'notifications.view',
    'notifications.history.view',
    'ia.view',
    'biens.sortie.request',
    // ✅ Plan comptable - Gestion complète
    'plan_comptable.view',
    'plan_comptable.create',
    'plan_comptable.update',
    'plan_comptable.delete',
  ],
  TECHNICIEN: [
    'dashboard.view',
    'biens.view',
    'biens.update.limited',
    'pannes.view',
    'pannes.create',
    'pannes.update',
    'pannes.close',
    'pannes.urgent.view',
    'maintenances.view',
    'maintenances.create',
    'maintenances.update',
    'maintenances.close',
    'maintenances.preventive.plan',
    'maintenances.history.view',
    'maintenance.budget.view',
    'maintenance.budget.create',
    'maintenance.budget.update',
    'pieces.view',
    'notifications.view',
    'notifications.history.view',
    'rapports.techniques.view',
    // ❌ Pas d'accès au plan comptable
  ],
  MAGASINIER: [
    'dashboard.view',
    'pannes.view',
    'pieces.view',
    'pieces.create',
    'pieces.update',
    'pieces.stock.manage',
    'pieces.stock.alerts.view',
    'pieces.stock.out',
    'fournitures.view',
    'fournitures.validate',
    'ia.view',
    'notifications.view',
    'notifications.history.view',
    // ❌ Pas d'accès au plan comptable
  ],
  GESTIONNAIRE: [
    'dashboard.view',
    'biens.view',
    'biens.view.financial',
    'biens.inventory',
    'biens.create',
    'biens.update',
    'biens.delete',
    'besoins.attente_stock.view',
    'pieces.view',
    'pieces.stock.alerts.view',
    'notifications.view',
    'notifications.history.view',
    // ❌ Pas d'accès au plan comptable
  ],
  CAISSE: [
    'dashboard.view',
    'validations.view',
    'validations.validate',
    'notifications.view',
    'notifications.history.view',
    // ❌ Pas d'accès au plan comptable
  ],
};

/** Mapping route → permission minimale requise */
export const ROUTE_PERMISSIONS = {
  '/dashboard': 'dashboard.view',
  '/scan': 'pieces.view',
  '/utilisateurs': 'users.view',
  '/utilisateurs/permissions': 'users.permissions.manage',
  '/biens': 'biens.view',
  '/biens/nouveau': 'biens.create',
  '/pannes': 'pannes.view',
  '/pannes/declarer': 'pannes.create',
  '/pannes/mes-pannes': 'pannes.view',
  '/pieces': 'pieces.view',
  '/pieces/catalogue': 'pieces.view',
  '/pieces/stock': 'pieces.stock.manage',
  '/fournitures/en-attente': 'fournitures.view',
  '/besoins/attente-stock': 'besoins.attente_stock.view',
  '/maintenances': 'maintenances.view',
  '/maintenances/planning': 'maintenances.view',
  '/maintenances/nouveau': 'maintenances.create',
  '/maintenances/liste': 'maintenances.view',
  '/maintenances/alertes': 'maintenances.view',
  '/maintenances/mes-maintenances': 'maintenances.view',
  '/maintenances/a-venir': 'maintenances.view',
  '/maintenances/en-retard': 'maintenances.view',
  '/validations': 'validations.view',
  '/validations/historique': 'validations.view',
  '/caisse': 'validations.view',
  '/budgets': 'validations.view',
  '/budgets-page': 'validations.view',
  '/amortissements': 'amortissements.view',
  '/amortissements/nouveau': 'amortissements.generate',
  '/amortissements/ecritures': 'amortissements.ecritures',
  '/amortissements/regles': 'amortissements.update',
  '/amortissements/cloture': 'amortissements.generate',
  
  // ✅ PLAN COMPTABLE
  '/plan-comptable': 'plan_comptable.view',
  
  '/cessions/nouveau': 'amortissements.ecritures',
  '/rebut/nouveau': 'amortissements.ecritures',
  '/rapports': 'rapports.export',
  '/rapports/financiers': 'rapports.financiers.view',
  '/rapports/techniques': 'rapports.techniques.view',
  '/rapports/amortissements': 'rapports.amortissements.view',
  '/notifications': 'notifications.history.view',
  '/audit/journal': 'audit.view',
  '/audit/journal-audit': 'audit.view',
  '/audit/fiche-audit': 'audit.view',
  '/audit/historique': 'audit.view',
  '/ia/aide-decision': 'rapports.view',
  '/ia/alertes-achat': 'rapports.view',
  '/ia/assistant': 'dashboard.view',
  '/profil': 'dashboard.view',
  '/parametres': 'dashboard.view',
  '/prints/fiche-bien': 'biens.view',
};

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/404',
]);

export function isPublicRoute(pathname) {
  if (!pathname || typeof pathname !== 'string') return false;
  const path = pathname.split('?')[0].split('#')[0].trim();
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  return PUBLIC_ROUTES.has(normalized || '/');
}

/** Alias legacy → permissions métier */
const LEGACY_ALIASES = {
  view_dashboard: 'dashboard.view',
  view_bien: 'biens.view',
  create_bien: 'biens.create',
  edit_bien: 'biens.update',
  delete_bien: 'biens.delete',
  view_panne: 'pannes.view',
  create_panne: 'pannes.create',
  update_panne: 'pannes.update',
  view_maintenance: 'maintenances.view',
  create_maintenance: 'maintenances.create',
  view_validation: 'validations.view',
  view_amortissement: 'amortissements.view',
  create_amortissement: 'amortissements.generate',
  view_piece: 'pieces.view',
  create_piece: 'pieces.create',
  edit_piece: 'pieces.update',
  view_users: 'users.view',
  manage_roles: 'users.permissions.manage',
  view_bien_financial: 'biens.view.financial',
  view_bien_inventory: 'biens.inventory',
  edit_bien_limited: 'biens.update.limited',
  view_plan_comptable: 'plan_comptable.view',
  create_plan_comptable: 'plan_comptable.create',
  update_plan_comptable: 'plan_comptable.update',
  delete_plan_comptable: 'plan_comptable.delete',
};

const matchesPermission = (perms, permission) => {
  if (!Array.isArray(perms) || !permission) return false;
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const [prefix] = String(permission).split('.');
  if (prefix && perms.includes(`${prefix}.*`)) return true;
  return false;
};

/** Pages d'accueil par rôle (ordre de priorité pour la redirection post-login) */
export const ROLE_HOME_PATHS = {
  MAGASINIER: ['/dashboard', '/fournitures/en-attente', '/pieces/stock', '/scan', '/notifications'],
  GESTIONNAIRE: ['/dashboard', '/besoins/attente-stock', '/notifications'],
  CAISSE: ['/dashboard', '/validations', '/notifications'],
  TECHNICIEN: ['/dashboard', '/pannes/mes-pannes', '/maintenances/planning'],
  COMPTABLE: ['/dashboard', '/biens', '/amortissements', '/plan-comptable'],
  DG: ['/dashboard', '/rapports/financiers', '/validations'],
  ADMIN: ['/dashboard', '/utilisateurs', '/plan-comptable'],
};

export function userHasPermission(user, permission) {
  if (!user || !permission) return false;

  const candidates = new Set([permission, LEGACY_ALIASES[permission]].filter(Boolean));

  for (const candidate of candidates) {
    if (matchesPermission(user.permissions, candidate)) return true;
  }

  for (const role of user.roles || []) {
    const rolePerms = ROLE_PERMISSIONS[String(role).toUpperCase()];
    for (const candidate of candidates) {
      if (matchesPermission(rolePerms, candidate)) return true;
    }
  }

  return false;
}

/** Permissions alternatives acceptées pour certaines routes */
const ROUTE_PERMISSION_ALTERNATIVES = {
  'biens.update': ['biens.update.limited'],
  'plan_comptable.update': ['plan_comptable.create', 'plan_comptable.delete'],
};

export function userHasAnyPermission(user, permissions) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.some((permission) => userHasPermission(user, permission));
}

export function getRoutePermissions(pathname) {
  const required = resolveRoutePermission(pathname);
  if (required === 'public') return ['public'];
  if (!required) return [];
  const alternatives = ROUTE_PERMISSION_ALTERNATIVES[required] || [];
  return [required, ...alternatives];
}

export function userCanAccessPath(user, pathname) {
  if (!pathname) return false;
  const perms = getRoutePermissions(pathname);
  if (perms.includes('public')) return true;
  if (perms.length === 0) return false;
  return userHasAnyPermission(user, perms);
}

export function getAccessibleHomePath(user) {
  if (!user) return '/dashboard';

  const roles = (user.roles || []).map((r) => String(r).trim().toUpperCase());
  const candidates = [];

  for (const role of roles) {
    const paths = ROLE_HOME_PATHS[role];
    if (paths) candidates.push(...paths);
  }
  candidates.push('/dashboard');

  const unique = [...new Set(candidates)];
  const accessible = unique.find((path) => userCanAccessPath(user, path));

  if (import.meta.env.DEV && !accessible) {
    console.warn('[auth] Aucune page d\'accueil accessible pour', roles);
  }

  return accessible || '/dashboard';
}

export function resolveRoutePermission(pathname) {
  if (PUBLIC_ROUTES.has(pathname)) return 'public';

  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];

  if (pathname.startsWith('/fournitures/valider/')) return 'fournitures.view';
  if (pathname.startsWith('/biens/') && pathname.endsWith('/edit')) return 'biens.update';
  if (pathname.match(/^\/biens\/[^/]+$/)) return 'biens.view';
  if (pathname.startsWith('/biens/')) return 'biens.view';
  if (pathname.startsWith('/pannes/')) return 'pannes.view';
  if (pathname.match(/^\/maintenances\/[^/]+$/)) return 'maintenances.view';
  if (pathname.startsWith('/maintenances/')) return 'maintenances.view';
  if (pathname.startsWith('/validations/')) return 'validations.view';
  if (pathname.startsWith('/cessions/')) return 'amortissements.ecritures';
  if (pathname.startsWith('/rebut/')) return 'amortissements.ecritures';
  if (pathname.startsWith('/amortissements/')) return 'amortissements.view';
  if (pathname.startsWith('/mouvements/nouveau')) return 'biens.create';
  if (pathname.startsWith('/mouvements/')) return 'biens.view';
  if (pathname.startsWith('/besoins/')) {
    if (pathname === '/besoins/attente-stock') return 'besoins.attente_stock.view';
    return 'pannes.view';
  }
  if (pathname.startsWith('/fournitures/')) return 'fournitures.view';
  if (pathname.startsWith('/audit/')) return 'audit.view';
  if (pathname.startsWith('/ia/')) return 'rapports.view';
  if (pathname.startsWith('/utilisateurs/')) return 'users.view';
  if (pathname.startsWith('/profil')) return 'dashboard.view';
  if (pathname.startsWith('/parametres')) return 'dashboard.view';
  if (pathname.startsWith('/prints/etat-besoin')) return 'pannes.view';
  if (pathname.startsWith('/prints/fiche-amortissement')) return 'amortissements.view';
  if (pathname.startsWith('/prints/')) return 'biens.view';
  
  // ✅ PLAN COMPTABLE - Routes dynamiques
  if (pathname.startsWith('/plan-comptable')) return 'plan_comptable.view';
  if (pathname.startsWith('/budgets')) return 'validations.view';

  if (import.meta.env.DEV) {
    console.warn(`Permission non définie pour ${pathname}, accès refusé par défaut`);
  }
  return null;
}