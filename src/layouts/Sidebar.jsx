import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveRoutePermission,isPlatformAdmin } from '../config/permissions';
import AccessibleClickable from '../components/common/AccessibleClickable';
import {
  Squares2X2Icon,
  UserGroupIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CalculatorIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  QrCodeIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  BellIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  BuildingOffice2Icon as BuildingOfficeOutline,
  CreditCardIcon,
  ReceiptPercentIcon,
  FolderOpenIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

const linkBase = 'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors';
const linkActive = 'nav-item-active';
const linkInactive = 'nav-item';
const childActive = 'block px-4 py-2 text-sm rounded-lg nav-child-active';
const childInactive = 'block px-4 py-2 text-sm rounded-lg nav-child';

const Sidebar = ({ isOpen, setIsOpen, collapsed = false, isLarge = true }) => {
  // ═══ AJOUT 5.23 — hasModule ═══
  const { user, hasPermission, hasModule } = useAuth();
  // ═══ FIN AJOUT ═══
  const { t } = useLanguage();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  const hasRole = (roles) => {
    if (!roles) return true;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    if (rolesArray.length === 0) return true;
    if (!user) return false;

    let userRolesArray = [];
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      userRolesArray = user.roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean);
    } else if (typeof user.roles === 'string') {
      userRolesArray = [user.roles.trim().toUpperCase()];
    } else if (user.role) {
      if (typeof user.role === 'object' && user.role.nom) {
        userRolesArray = [String(user.role.nom).trim().toUpperCase()];
      } else {
        userRolesArray = [String(user.role).trim().toUpperCase()];
      }
    } else if (user.role_nom) {
      userRolesArray = [String(user.role_nom).trim().toUpperCase()];
    }

    if (userRolesArray.length === 0) return false;

    return rolesArray.some((role) => {
      const roleUpper = String(role).trim().toUpperCase();
      return userRolesArray.includes(roleUpper);
    });
  };

  const canAccessPath = (path) => {
    const perm = resolveRoutePermission(path);
    return !perm || hasPermission(perm);
  };

  // ════════════════════════════════════════════════════════════════
  // ═══ MODIF 5.23 — Ajout du filtre module dans canAccessItem   ═══
  // ════════════════════════════════════════════════════════════════
  const canAccessItem = (item) => {
    if (hasRole('COMPTABLE')) {
      if (item.path === '/scan' || item.labelKey === 'navScan') return false;
      if (item.labelKey === 'navSpareParts') return false;
    }
    if (hasRole('ADMIN') && item.labelKey === 'navFournitures') return false;

    if (!hasRole(item.roles)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;

    // 🆕 AJOUT 5.23 — Filtre module (multi-tenant SaaS)
    if (item.module && !hasModule(item.module)) return false;

    // 🆕 AJOUT 5.23-bis — Filtre platformOnly (admin plateforme)
    if (item.platformOnly && !isPlatformAdmin(user)) return false;

    if (item.path) return canAccessPath(item.path);
    if (item.children) {
      return item.children.some(
        (child) =>
          hasRole(child.roles) &&
          (!child.permission || hasPermission(child.permission)) &&
          // 🆕 AJOUT 5.23
          (!child.module || hasModule(child.module)) &&
          canAccessPath(child.path)
      );
    }
    return true;
  };
  // ═══ FIN MODIF 5.23 ═══

  // ════════════════════════════════════════════════════════════════
  // ═══ MODIF 5.23 — Ajout du champ `module` sur chaque item      ═══
  // ════════════════════════════════════════════════════════════════
  const menuItems = [
    {
      labelKey: 'navDashboard',
      path: '/dashboard',
      icon: Squares2X2Icon,
      // 🆕 PAS DE MODULE — toujours visible
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN', 'CAISSE', 'MAGASINIER'],
      permission: 'dashboard.view',
    },
    {
      labelKey: 'navScan',
      path: '/scan',
      icon: QrCodeIcon,
      module: 'MAINTENANCE',                                    // 🆕 AJOUT
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN', 'CAISSE', 'MAGASINIER'],
      permission: 'pieces.view',
    },
    {
      labelKey: 'navUsers',
      icon: UserGroupIcon,
      // 🆕 PAS DE MODULE — admin only
      roles: ['ADMIN'],
      permission: 'users.view',
      children: [
        { labelKey: 'navUsersList', path: '/utilisateurs' },
        { labelKey: 'navPermissions', path: '/utilisateurs/permissions', permission: 'users.permissions.manage' },
      ],
    },
    {
      labelKey: 'navAssets',
      icon: CubeIcon,
      module: 'IMMOBILISATION',                                 // 🆕 AJOUT
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'],
      permission: 'biens.view',
      children: [
        { labelKey: 'navAllAssets', path: '/biens' },
        { labelKey: 'navAddAsset', path: '/biens/nouveau', roles: ['COMPTABLE', 'ADMIN'] },
        { labelKey: 'navPartsMgmt', path: '/pieces', roles: ['COMPTABLE'], module: 'MAINTENANCE' },   // 🆕
      ],
    },
    {
      labelKey: 'navBreakdowns',
      icon: ExclamationTriangleIcon,
      module: 'MAINTENANCE',                                    // 🆕 AJOUT
      roles: ['ADMIN', 'TECHNICIEN', 'DG'],
      permission: 'pannes.view',
      children: [
        { labelKey: 'navDeclareBreakdown', path: '/pannes/declarer', roles: ['TECHNICIEN'] },
        { labelKey: 'navMyInterventions', path: '/pannes/mes-pannes', roles: ['TECHNICIEN'] },
        { labelKey: 'navAllBreakdowns', path: '/pannes', roles: ['ADMIN', 'DG', 'TECHNICIEN'] },
      ],
    },
    {
      labelKey: 'navSpareParts',
      icon: PuzzlePieceIcon,
      module: 'MAINTENANCE',                                    // 🆕 AJOUT
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'MAGASINIER'],
      permission: 'pieces.view',
      children: [
        { labelKey: 'navAddParts', path: '/pieces', roles: ['MAGASINIER'] },
        { labelKey: 'navPartsCatalog', path: '/pieces/catalogue', roles: ['COMPTABLE', 'MAGASINIER'] },
        { labelKey: 'navStockMovements', path: '/pieces/stock', roles: ['MAGASINIER'] },
        { labelKey: 'navBesoinsAttenteStock', path: '/besoins/attente-stock', roles: ['ADMIN', 'GESTIONNAIRE', 'DG'], permission: 'besoins.attente_stock.view' },
      ],
    },
    {
      labelKey: 'navFournitures',
      icon: ArchiveBoxIcon,
      module: 'MAINTENANCE',                                    // 🆕 AJOUT
      roles: ['MAGASINIER', 'ADMIN'],
      permission: 'fournitures.view',
      children: [
        { labelKey: 'navFournituresPending', path: '/fournitures/en-attente', roles: ['MAGASINIER', 'ADMIN'] },
      ],
    },
    {
      labelKey: 'navMaintenance',
      icon: WrenchScrewdriverIcon,
      module: 'MAINTENANCE',                                    // 🆕 AJOUT
      roles: ['ADMIN', 'TECHNICIEN'],
      permission: 'maintenances.view',
      children: [
        { labelKey: 'navPlanning', path: '/maintenances/planning', roles: ['TECHNICIEN', 'ADMIN'] },
        { labelKey: 'navMyInterventions', path: '/maintenances/mes-maintenances', roles: ['TECHNICIEN'] },
        { labelKey: 'navUpcoming', path: '/maintenances/a-venir', roles: ['TECHNICIEN', 'ADMIN'] },
        { labelKey: 'navOverdue', path: '/maintenances/en-retard', roles: ['TECHNICIEN', 'ADMIN'] },
      ],
    },
    {
      labelKey: 'navValidations',
      icon: CheckCircleIcon,
      // 🆕 PAS DE MODULE — workflow transverse
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'CAISSE'],
      permission: 'validations.view',
      children: [
        { labelKey: 'navPending', path: '/validations', roles: ['DG', 'COMPTABLE', 'CAISSE', 'ADMIN'] },
        { labelKey: 'navHistory', path: '/validations/historique', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
      ],
    },
    {
      labelKey: 'navCaisse',
      path: '/caisse',
      icon: BanknotesIcon,
      module: 'IMMOBILISATION',                                 // 🆕 AJOUT
      roles: ['CAISSE', 'ADMIN', 'DG', 'COMPTABLE'],
      permission: 'validations.view',
    },
    {
      labelKey: 'navBudgets',
      path: '/budgets',
      icon: CurrencyDollarIcon,
      module: 'IMMOBILISATION',                                 // 🆕 AJOUT
      roles: ['COMPTABLE', 'ADMIN', 'DG'],
      permission: 'validations.view',
    },
    {
      labelKey: 'navDepreciation',
      icon: CalculatorIcon,
      module: 'IMMOBILISATION',                                 // 🆕 AJOUT
      roles: ['ADMIN', 'COMPTABLE'],
      permission: 'amortissements.view',
      children: [
        { labelKey: 'navHistory', path: '/amortissements', roles: ['ADMIN', 'COMPTABLE'] },
        { labelKey: 'navAccountingEntries', path: '/amortissements/ecritures', roles: ['COMPTABLE'] },
        { labelKey: 'navDepreciationRules', path: '/amortissements/regles', roles: ['COMPTABLE'] },
        { labelKey: 'navPlanComptable', path: '/plan-comptable', roles: ['COMPTABLE', 'ADMIN'] },
        { labelKey: 'navCloture', path: '/amortissements/cloture', roles: ['ADMIN', 'COMPTABLE'] },
      ],
    },
    {
      labelKey: 'navReports',
      icon: DocumentTextIcon,
      module: 'REPORTING_AVANCE',                               // 🆕 AJOUT
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'],
      permission: 'rapports.view',
      children: [
        { labelKey: 'navFinancialReport', path: '/rapports/financiers', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
        { labelKey: 'navTechnicalReport', path: '/rapports/techniques', roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'] },
        { labelKey: 'navDepreciationReport', path: '/rapports/amortissements', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
        { labelKey: 'navTableau8', path: '/rapports/tableau8', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
        { labelKey: 'navPrevisions', path: '/rapports/previsions', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
        { labelKey: 'navEtats', path: '/etats', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
      ],
    },
    {
      labelKey: 'navPermissions',
      icon: ShieldCheckIcon,
      // 🆕 PAS DE MODULE — admin only
      roles: ['ADMIN'],
      permission: 'permission.gerer',
      children: [
        { labelKey: 'navPermissionsList', path: '/permissions' },
        { labelKey: 'navPermissionsRoles', path: '/permissions/roles' },
      ],
    },
    {
      labelKey: 'navImport',
      path: '/import',
      icon: ArrowUpTrayIcon,
      module: 'IMPORT_CSV',                                     // 🆕 AJOUT
      roles: ['ADMIN'],
      permission: 'import.executer',
    },
    {
      labelKey: 'navAI',
      icon: SparklesIcon,
      module: 'IMMOBILISATION',                                 // 🆕 AJOUT
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'MAGASINIER', 'TECHNICIEN'],
      permission: 'dashboard.view',
      children: [
        { labelKey: 'navAIDecision', path: '/ia/aide-decision', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
        { labelKey: 'navAIAssistant', path: '/ia/assistant', roles: ['ADMIN', 'DG', 'COMPTABLE', 'MAGASINIER'] },
        { labelKey: 'navAIPredictions', path: '/ia/alertes-achat', roles: ['ADMIN', 'DG', 'COMPTABLE'] },
      ],
    },
    {
      labelKey: 'navOrganisations',
      path: '/organisations',
      icon: BuildingOfficeOutline,
      platformOnly: true,                                       // 🆕 5.23-bis
      roles: ['ADMIN'],
      permission: 'organisation.voir',
    },
    {
      labelKey: 'navSaaS',
      icon: CreditCardIcon,
      // 🆕 PAS DE MODULE — admin plateforme
      roles: ['ADMIN', 'DG'],
      permission: 'abonnement.voir',
      children: [
        { labelKey: 'navAbonnements', path: '/abonnements', roles: ['ADMIN', 'DG'] },
        { labelKey: 'navFacturation', path: '/facturation', roles: ['ADMIN'] },
      ],
    },
    {
      labelKey: 'navProjets',
      icon: FolderOpenIcon,
      module: 'PROJET',                                         // 🆕 AJOUT
      roles: ['ADMIN', 'DG', 'RESPONSABLE_PROJET', 'LOGISTICIEN'],
      permission: 'projet.voir',
      children: [
        { labelKey: 'navProjetsList', path: '/projets', roles: ['ADMIN', 'DG', 'RESPONSABLE_PROJET', 'LOGISTICIEN'] },
      ],
    },
    {
      labelKey: 'navWorkflowConfig',
      path: '/workflow',
      icon: AdjustmentsHorizontalIcon,
      module: 'WORKFLOW_PERSONNALISE',                          // 🆕 AJOUT
      roles: ['ADMIN'],
      permission: 'workflow.voir',
    },
    {
      labelKey: 'navAudit',
      path: '/audit/journal',
      icon: ClipboardDocumentCheckIcon,
      module: 'IMMOBILISATION',                                 // 🆕 AJOUT
      roles: ['ADMIN', 'DG'],
      permission: 'audit.view',
    },
    {
      labelKey: 'navNotifications',
      path: '/notifications',
      icon: BellIcon,
      // 🆕 PAS DE MODULE — toujours visible
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN', 'CAISSE', 'MAGASINIER'],
      permission: 'notifications.history.view',
    },
  ];
  // ═══ FIN MODIF 5.23 ═══

  const filteredItems = menuItems.filter(canAccessItem);

  useEffect(() => {
    filteredItems.forEach((item, idx) => {
      if (item.children?.some((c) => location.pathname.startsWith(c.path))) {
        setOpenMenus((prev) => ({ ...prev, [idx]: true }));
      }
    });
  }, [location.pathname]);

  const toggleMenu = (index) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isChildActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const sidebarWidth = collapsed && isLarge ? 'w-16' : 'w-64';
  const showLabels = !collapsed || !isLarge;

  const asideClasses = `
    no-print fixed left-0 top-16 bottom-0 z-20 overflow-y-auto transition-all duration-300
    bg-sidebar-light dark:bg-sidebar-dark
    border-r border-border-light dark:border-border-dark
    ${sidebarWidth}
    ${!isLarge && !isOpen ? '-translate-x-full' : 'translate-x-0'}
  `;

  const renderIcon = (Icon, className = 'w-5 h-5 shrink-0') => <Icon className={className} />;

  if (collapsed && isLarge) {
    return (
      <aside className={asideClasses}>
        <nav className="py-4">
          {filteredItems.map((item, idx) =>
            item.path ? (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) =>
                  `flex justify-center p-3 mx-2 rounded-lg transition-colors ${isActive ? linkActive : linkInactive
                  }`
                }
                title={t(item.labelKey)}
              >
                {renderIcon(item.icon)}
              </NavLink>
            ) : (
              item.children && (
                <div key={idx} className="relative group">
                  <div className="flex justify-center p-3 mx-2 rounded-lg text-gray-600 dark:text-slate-300 cursor-pointer hover:bg-white/70 dark:hover:bg-night-active">
                    {renderIcon(item.icon)}
                  </div>
                  <div
                    className="absolute left-full top-0 ml-2 py-2 min-w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30
                      bg-surface-light dark:bg-surface-dark shadow-dropdown rounded-lg border border-border-light dark:border-border-dark"
                  >
                    {item.children
                      .filter((child) => {
                        if (hasRole('COMPTABLE') && child.labelKey === 'navPartsMgmt') return false;
                        return (
                          hasRole(child.roles) &&
                          (!child.permission || hasPermission(child.permission)) &&
                          (!child.module || hasModule(child.module)) &&   // 🆕 AJOUT
                          canAccessPath(child.path)
                        );
                      })
                      .map((child, cidx) => (
                        <NavLink
                          key={cidx}
                          to={child.path}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm ${isActive || isChildActive(child.path)
                              ? 'bg-primary-50 text-primary-600 font-medium dark:bg-night-active-sub dark:text-white'
                              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-night-active dark:hover:text-white'
                            }`
                          }
                        >
                          {t(child.labelKey)}
                        </NavLink>
                      ))}
                  </div>
                </div>
              )
            )
          )}
        </nav>
      </aside>
    );
  }

  return (
    <>
      {!isLarge && isOpen && (
        <AccessibleClickable
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsOpen(false)}
          ariaLabel={t('landingCloseMenu')}
        />
      )}
      <aside className={asideClasses}>
        {showLabels && (
          <div className="px-4 py-4 mb-1 border-b border-border-light dark:border-border-dark">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              OKAPI
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('sidebarModule')}</p>
          </div>
        )}
        <nav className="py-3 px-1">
          {filteredItems.map((item, idx) => {
            if (item.children) {
              const isOpenMenu = openMenus[idx];
              const hasActiveChild = item.children.some((c) => isChildActive(c.path));
              return (
                <div key={idx} className="mb-0.5">
                  <button
                    onClick={() => toggleMenu(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 mx-1 rounded-lg transition-colors
                      ${hasActiveChild ? 'text-primary-600 dark:text-white dark:bg-night-active/60' : 'text-gray-700 dark:text-slate-300'}
                      hover:bg-white/70 dark:hover:bg-night-active dark:hover:text-white`}
                  >
                    <div className="flex items-center gap-3">
                      {renderIcon(item.icon)}
                      <span className="text-sm font-medium">{t(item.labelKey)}</span>
                    </div>
                    <ChevronRightIcon
                      className={`w-4 h-4 transition-transform ${isOpenMenu ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {isOpenMenu && (
                    <div className="ml-9 mt-0.5 space-y-0.5">
                      {item.children
                        .filter((child) => {
                          if (hasRole('COMPTABLE') && child.labelKey === 'navPartsMgmt') return false;
                          return (
                            hasRole(child.roles) &&
                            (!child.permission || hasPermission(child.permission)) &&
                            (!child.module || hasModule(child.module)) &&   // 🆕 AJOUT
                            canAccessPath(child.path)
                          );
                        })
                        .map((child, cidx) => (
                          <NavLink
                            key={cidx}
                            to={child.path}
                            onClick={() => !isLarge && setIsOpen(false)}
                            className={({ isActive }) =>
                              isActive || isChildActive(child.path) ? childActive : childInactive
                            }
                          >
                            {t(child.labelKey)}
                          </NavLink>
                        ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => !isLarge && setIsOpen(false)}
                className={({ isActive }) =>
                  `${linkBase} px-3 py-2.5 mx-1 ${isActive ? linkActive : linkInactive}`
                }
              >
                {renderIcon(item.icon)}
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;