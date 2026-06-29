import React, { useState, useEffect } from 'react';
import etatsFinanciersService from '../../services/etatsFinanciers';
import Card from '../ui/Card';
import { AppIcon } from '../ui/icons';
import {
  ArrowUpTrayIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/LanguageContext';

const EtatSortie = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    etatsFinanciersService.getEtatSortie()
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
      <Card className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200 dark:border-rose-800/50">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {t('etats.totalDepensesSortie') || 'Total Dépenses Sortie / Maintenance'}
            </h4>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              ${data?.total_depenses?.toLocaleString('en-US') || '0'}
            </p>
          </div>
          <div className="p-4 bg-rose-500/10 rounded-2xl">
            <AppIcon icon={ArrowUpTrayIcon} size="lg" className="text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AppIcon icon={WrenchScrewdriverIcon} size="md" className="text-primary-500" />
            {t('etats.depensesParType') || 'Dépenses par Type de Maintenance'}
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5">
          {data?.par_type && Object.entries(data.par_type).length > 0 ? (
            Object.entries(data.par_type).map(([type, montant]) => {
              const configs = {
                PREVENTIVE: { icon: Cog6ToothIcon, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                CORRECTIVE: { icon: WrenchScrewdriverIcon, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                PREDICTIVE: { icon: ChartBarIcon, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
              };
              const config = configs[type] || configs.PREVENTIVE;
              return (
                <div key={type} className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 ${config.bg}`}>
                  <div className="flex items-center gap-3">
                    <AppIcon icon={config.icon} size="md" className={config.color} />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                    ${montant.toLocaleString('en-US')}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-6 text-gray-400 dark:text-slate-500">
              {t('etats.aucuneDonnee') || 'Aucune donnée disponible'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EtatSortie;