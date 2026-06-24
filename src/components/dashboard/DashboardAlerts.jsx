import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import { useLanguage } from '../../context/LanguageContext';

const alertConfig = [
  { key: 'pannes_urgentes', labelKey: 'alertUrgentBreakdowns', path: '/pannes', icon: ExclamationTriangleIcon, critical: true },
  { key: 'maintenances_en_retard', labelKey: 'alertOverdueMaintenance', path: '/maintenances/en-retard', icon: WrenchScrewdriverIcon, critical: true },
  { key: 'validations_en_attente', labelKey: 'alertPendingValidation', path: '/validations', icon: CheckCircleIcon },
  { key: 'stocks_faibles', labelKey: 'alertLowStock', path: '/pieces/stock', icon: ArchiveBoxIcon },
  { key: 'ruptures_stock', labelKey: 'alertStockOut', path: '/pieces/stock', icon: ArchiveBoxIcon, critical: true },
  { key: 'maintenances_a_venir', labelKey: 'navUpcoming', path: '/maintenances/a-venir', icon: WrenchScrewdriverIcon },
  { key: 'amortissements_a_generer', labelKey: 'alertDepreciationDue', path: '/amortissements', icon: CheckCircleIcon },
  { key: 'biens_totalement_amortis', labelKey: 'alertFullyDepreciated', path: '/amortissements', icon: CheckCircleIcon },
  { key: 'budgets_maintenance_a_valider', labelKey: 'alertBudgetPending', path: '/validations', icon: CheckCircleIcon },
];

const DashboardAlerts = ({ alertes }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!alertes) return null;

  const active = alertConfig.filter((a) => (alertes[a.key] || 0) > 0);
  if (active.length === 0) {
    return (
      <Card title={t('urgentAlerts')} icon={<ExclamationTriangleIcon className="w-5 h-5" />} compact>
        <p className="text-sm text-gray-500 dark:text-slate-400 py-2">{t('noUrgentAlerts')}</p>
      </Card>
    );
  }

  return (
    <Card title={t('urgentAlerts')} icon={<ExclamationTriangleIcon className="w-5 h-5" />} compact>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {active.map((a) => {
          const count = alertes[a.key];
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => navigate(a.path)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-night-hover ${
                a.critical
                  ? 'border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10'
                  : 'border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  a.critical
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'
                    : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{t(a.labelKey)}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{count}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default DashboardAlerts;
