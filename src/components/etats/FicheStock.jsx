import React, { useState, useEffect } from 'react';
import etatsFinanciersService from '../../services/etatsFinanciers';
import Card from '../ui/Card';
import { AppIcon } from '../ui/icons';
import {
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  RectangleStackIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from '../../context/LanguageContext';

const FicheStock = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    etatsFinanciersService.getFicheStock()
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
                {t('etats.totalPieces') || 'Total Pièces en Stock'}
              </h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data?.total_pieces || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <AppIcon icon={ArchiveBoxIcon} size="lg" className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t('etats.valeurStock') || 'Valeur Totale du Stock'}
              </h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${data?.valeur_totale ? data.valeur_totale.toLocaleString('en-US') : '0'}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <AppIcon icon={CurrencyDollarIcon} size="lg" className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AppIcon icon={RectangleStackIcon} size="md" className="text-primary-500" />
            {t('etats.repartitionCategorie') || 'Répartition par Catégorie'}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="app-table">
            <thead>
              <tr>
                <th>{t('etats.categorie') || 'Catégorie'}</th>
                <th className="text-center">{t('etats.quantite') || 'Quantité'}</th>
                <th className="text-right">{t('etats.valeurTotale') || 'Valeur Totale'}</th>
              </tr>
            </thead>
            <tbody>
              {data?.pieces_par_categorie?.length > 0 ? (
                data.pieces_par_categorie.map((cat, idx) => (
                  <tr key={idx}>
                    <td className="font-medium flex items-center gap-2">
                      <AppIcon icon={CubeIcon} size="sm" className="text-gray-400" />
                      {cat.categorie}
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                        {cat.quantite}
                      </span>
                    </td>
                    <td className="text-right font-medium text-gray-900 dark:text-white">
                      ${cat.valeur?.toLocaleString('en-US') || '0'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-gray-400 dark:text-slate-500">
                    {t('etats.aucuneDonnee') || 'Aucune donnée disponible'}
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

export default FicheStock;