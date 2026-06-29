import React, { useState, useEffect } from 'react';
import etatsFinanciersService from '../../services/etatsFinanciers';
import Card from '../ui/Card';
import { AppIcon } from '../ui/icons';
import {
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/LanguageContext';

const EtatParc = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    etatsFinanciersService.getEtatParc()
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
                {t('etats.totalBiens') || 'Total des Biens'}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data?.total_biens || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <AppIcon icon={CubeIcon} size="lg" className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.scoreMoyen') || 'Score de Fiabilité Moyen'}
              </h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {data?.score_moyen || 0}%
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <AppIcon icon={ChartBarIcon} size="lg" className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200 dark:border-rose-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.biensCritiques') || 'Biens Critiques'}
              </h4>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {data?.biens_critiques?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl">
              <AppIcon icon={ExclamationTriangleIcon} size="lg" className="text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AppIcon icon={ExclamationTriangleIcon} size="md" className="text-amber-500" />
            {t('etats.biensARemplacer') || 'Biens recommandés au remplacement (Seuil VNC atteint)'}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead>
              <tr>
                <th>{t('etats.id') || 'ID'}</th>
                <th>{t('etats.designation') || 'Désignation'}</th>
                <th>{t('etats.ratioVNC') || 'Ratio VNC Restante'}</th>
                <th>{t('etats.statutCritique') || 'Statut Critique'}</th>
              </tr>
            </thead>
            <tbody>
              {data?.biens_a_remplacer?.length > 0 ? (
                data.biens_a_remplacer.map((bien) => (
                  <tr key={bien.id}>
                    <td className="font-mono text-xs">#{bien.id}</td>
                    <td className="font-medium">{bien.designation}</td>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {(bien.vnc_ratio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {bien.est_critique ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                          <AppIcon icon={ExclamationTriangleIcon} size="xs" />
                          {t('etats.oui') || 'Oui'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          <AppIcon icon={CheckCircleIcon} size="xs" />
                          {t('etats.standard') || 'Standard'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-400 dark:text-slate-500">
                    <AppIcon icon={CheckCircleIcon} size="md" className="mx-auto mb-2 text-emerald-500" />
                    {t('etats.aucunBienARemplacer') || 'Aucun bien à remplacer'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default EtatParc;