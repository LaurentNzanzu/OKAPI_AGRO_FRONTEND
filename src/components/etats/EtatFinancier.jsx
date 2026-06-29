import React, { useState, useEffect } from 'react';
import etatsFinanciersService from '../../services/etatsFinanciers';
import Card from '../ui/Card';
import { AppIcon } from '../ui/icons';
import {
  BuildingOffice2Icon,
  CalculatorIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/LanguageContext';

const EtatFinancier = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    etatsFinanciersService.getEtatFinancier()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent" />
      <span className="ml-3 text-gray-500 dark:text-slate-400">
        {t('common.loading') || 'Chargement...'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="app-stats-grid">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.valeurPatrimoine') || 'Valeur du Patrimoine'}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${data?.valeur_patrimoine?.toLocaleString('en-US') || '0'}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <AppIcon icon={BuildingOffice2Icon} size="lg" className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.cumulAmortissements') || 'Cumul Amortissements'}
              </h4>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                ${data?.cumul_amortissements?.toLocaleString('en-US') || '0'}
              </p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <AppIcon icon={CalculatorIcon} size="lg" className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.vncTotale') || 'VNC Totale'}
              </h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${data?.vnc_totale?.toLocaleString('en-US') || '0'}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <AppIcon icon={CheckCircleIcon} size="lg" className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.depensesMaintenance') || 'Dépenses Maintenance (Année)'}
              </h4>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                ${data?.depenses_maintenance?.toLocaleString('en-US') || '0'}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <AppIcon icon={WrenchScrewdriverIcon} size="lg" className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200 dark:border-rose-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.coutPannes') || 'Coût des Pannes (Année)'}
              </h4>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                ${data?.cout_pannes?.toLocaleString('en-US') || '0'}
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <AppIcon icon={ExclamationTriangleIcon} size="lg" className="text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EtatFinancier;