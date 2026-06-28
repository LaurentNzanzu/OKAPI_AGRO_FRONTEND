import React from 'react';
import {
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BoltIcon,
  CpuChipIcon,
  CircleStackIcon,
  BuildingOffice2Icon,
  CubeIcon,
  TruckIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  LinkIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  BriefcaseIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  PlayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon as DownloadIcon,
  UserGroupIcon,
  BellAlertIcon,
  TrophyIcon,
  FunnelIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  ArrowUturnLeftIcon,
  ArrowRightCircleIcon,
  ArrowUpTrayIcon,
  UserIcon,
  SignalIcon,
  XMarkIcon,
  LightBulbIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  PaperClipIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  RectangleStackIcon,
  BookmarkIcon,
  WrenchIcon,
  DocumentChartBarIcon,
  Cog8ToothIcon,
  CreditCardIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

/** Tailles cohérentes dans toute l'application */
export const ICON_SIZES = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const AppIcon = ({ icon: Icon, size = 'sm', className = '' }) => {
  if (!Icon) return null;
  return <Icon className={`${ICON_SIZES[size]} shrink-0 ${className}`} aria-hidden="true" />;
};

export const StatusBadge = ({ label, Icon, color, iconSize = 'xs' }) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${color}`}>
    {Icon && <AppIcon icon={Icon} size={iconSize} />}
    {label}
  </span>
);

/* ── Maintenance ── */
export const getMaintenanceTypeConfig = (t) => ({
  PREVENTIVE: { label: t('ui.icons.maintenanceType.preventive'), Icon: WrenchScrewdriverIcon, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200' },
  CORRECTIVE: { label: t('ui.icons.maintenanceType.corrective'), Icon: Cog6ToothIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  PREDICTIVE: { label: t('ui.icons.maintenanceType.predictive'), Icon: ChartBarIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
});

/** @deprecated Use getMaintenanceTypeConfig(t) */
export const MAINTENANCE_TYPE_CONFIG = {
  PREVENTIVE: { label: 'Préventive', Icon: WrenchScrewdriverIcon, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200' },
  CORRECTIVE: { label: 'Corrective', Icon: Cog6ToothIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  PREDICTIVE: { label: 'Prédictive', Icon: ChartBarIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

export const getMaintenanceStatutConfig = (t) => ({
  PLANIFIEE: { label: t('ui.icons.maintenanceStatut.planifiee'), Icon: CalendarDaysIcon, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300' },
  EN_COURS: { label: t('ui.icons.maintenanceStatut.enCours'), Icon: Cog6ToothIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  TERMINEE: { label: t('ui.icons.maintenanceStatut.terminee'), Icon: CheckCircleIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  REPORTEE: { label: t('ui.icons.maintenanceStatut.reportee'), Icon: ClockIcon, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ANNULEE: { label: t('ui.icons.maintenanceStatut.annulee'), Icon: XCircleIcon, color: 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-slate-400' },
});

/** @deprecated Use getMaintenanceStatutConfig(t) */
export const MAINTENANCE_STATUT_CONFIG = {
  PLANIFIEE: { label: 'Planifiée', Icon: CalendarDaysIcon, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300' },
  EN_COURS: { label: 'En cours', Icon: Cog6ToothIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  TERMINEE: { label: 'Terminée', Icon: CheckCircleIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  REPORTEE: { label: 'Reportée', Icon: ClockIcon, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ANNULEE: { label: 'Annulée', Icon: XCircleIcon, color: 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-slate-400' },
};

export const getPanneStatutConfig = (t) => ({
  DECLAREE: { label: t('ui.icons.panneStatut.declaree'), Icon: ClipboardDocumentListIcon, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300' },
  DIAGNOSTIQUEE: { label: t('ui.icons.panneStatut.diagnostiquee'), Icon: MagnifyingGlassIcon, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200' },
  EN_ATTENTE_PIECES: { label: t('ui.icons.panneStatut.enAttentePieces'), Icon: ClockIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  EN_VALIDATION: { label: t('ui.icons.panneStatut.enValidation'), Icon: DocumentTextIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  EN_COURS: { label: t('ui.icons.panneStatut.enCours'), Icon: Cog6ToothIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  EN_TEST: { label: t('ui.icons.panneStatut.enTest'), Icon: MagnifyingGlassIcon, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  TERMINEE: { label: t('ui.icons.panneStatut.terminee'), Icon: CheckCircleIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  ANNULEE: { label: t('ui.icons.panneStatut.annulee'), Icon: XCircleIcon, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
});

/** @deprecated Use getPanneStatutConfig(t) */
export const PANNE_STATUT_CONFIG = {
  DECLAREE: { label: 'Déclarée', Icon: ClipboardDocumentListIcon, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300' },
  DIAGNOSTIQUEE: { label: 'Diagnostiquée', Icon: MagnifyingGlassIcon, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200' },
  EN_ATTENTE_PIECES: { label: 'Attente pièces', Icon: ClockIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  EN_VALIDATION: { label: 'En validation', Icon: DocumentTextIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  EN_COURS: { label: 'En cours', Icon: Cog6ToothIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  EN_TEST: { label: 'En test', Icon: MagnifyingGlassIcon, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  TERMINEE: { label: 'Terminée', Icon: CheckCircleIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  ANNULEE: { label: 'Annulée', Icon: XCircleIcon, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export const PANNE_TYPE_CONFIG = {
  MECANIQUE: { label: 'Mécanique', Icon: WrenchScrewdriverIcon, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200' },
  ELECTRIQUE: { label: 'Électrique', Icon: BoltIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  ELECTRONIQUE: { label: 'Électronique', Icon: CpuChipIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  AUTRE: { label: 'Autre', Icon: CubeIcon, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-slate-300' },
};

export const PANNE_PRIORITE_CONFIG = {
  BASSE: { label: 'Basse', Icon: SignalIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  MOYENNE: { label: 'Moyenne', Icon: SignalIcon, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  HAUTE: { label: 'Haute', Icon: ExclamationTriangleIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  CRITIQUE: { label: 'Critique', Icon: BellAlertIcon, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

/* ── Mouvements ── */
export const MOUVEMENT_TYPE_CONFIG = {
  TRANSFERT: { label: 'Transfert', Icon: ArrowPathIcon, color: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200' },
  SORTIE: { label: 'Sortie', Icon: ArrowUpTrayIcon, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  CESSION: { label: 'Cession', Icon: CurrencyDollarIcon, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  AFFECTATION: { label: 'Affectation', Icon: UserIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  RETOUR: { label: 'Retour', Icon: ArrowUturnLeftIcon, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

/* ── Pièces / compatibilité ── */
export const PIECE_COMPAT_CONFIG = {
  VEHICULE: { label: 'Véhicule', Icon: TruckIcon },
  ORDINATEUR: { label: 'Ordinateur', Icon: ComputerDesktopIcon },
  MACHINE_PRODUCTION: { label: 'Machine de production', Icon: Cog6ToothIcon },
};

/* ── Rôles validation ── */
export const VALIDATION_ROLE_ICONS = {
  DG: BriefcaseIcon,
  COMPTABLE: CurrencyDollarIcon,
  CAISSE: BanknotesIcon,
};

/* ── Actions ── */
export {
  ArrowDownTrayIcon,
  DownloadIcon,
  PrinterIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  PlayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  LinkIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  BellAlertIcon,
  ClockIcon,
  ArrowPathIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  LightBulbIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  PaperClipIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  RectangleStackIcon,
  BookmarkIcon,
  WrenchIcon,
  DocumentChartBarIcon,
  Cog8ToothIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  CpuChipIcon,
  TruckIcon,
  ComputerDesktopIcon,
  ArrowRightCircleIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  ClockIcon as HourglassIcon,
  BriefcaseIcon,
  SignalIcon,
  CreditCardIcon,
  UserPlusIcon,
  QrCodeIcon,
};
