import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { iaService } from '../../../services/ia';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

const IADecisionWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [biensCritiques, setBiensCritiques] = useState([]);
  const [alertesPieces, setAlertesPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const parcData = await iaService.getRecommandationsParc();
      const critiques = parcData
        .filter((b) => b.score < 70)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
      setBiensCritiques(critiques);

      const alertesData = await iaService.getAlertesAchat();
      const alertesUrgentes = alertesData.filter((a) => a.action === 'ACHAT_URGENT');
      const alertesSurveiller = alertesData.filter((a) => a.action === 'SURVEILLER');
      setAlertesPieces([...alertesUrgentes, ...alertesSurveiller].slice(0, 3));
    } catch (err) {
      console.error('Erreur chargement données IA:', err);
      setError(t('ia.widget.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (score, statut) => {
    if (statut) {
      return statut === 'ACHAT_URGENT'
        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    }
    if (score < 50) return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    if (score < 70) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
    if (score < 90) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  };

  if (loading) {
    return (
      <Card title={t('ia.widget.title')} icon={<SparklesIcon className="w-5 h-5" />} compact>
        <LoadingSpinner size="sm" message={t('common.loading')} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={t('ia.widget.title')} icon={<SparklesIcon className="w-5 h-5" />} compact>
        <p className="text-danger text-sm">{error}</p>
      </Card>
    );
  }

  const headerAction = (
    <button
      type="button"
      onClick={() => navigate('/ia/aide-decision')}
      className="text-xs text-primary-600 dark:text-primary-200 hover:text-primary-700 font-medium flex items-center gap-1"
    >
      {t('ia.widget.seeAll')} <ArrowRightIcon className="w-3 h-3" />
    </button>
  );

  return (
    <Card
      title={t('ia.widget.title')}
      icon={<SparklesIcon className="w-5 h-5" />}
      actions={headerAction}
      compact
    >
      {biensCritiques.length === 0 && alertesPieces.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-success text-sm font-medium">{t('ia.widget.noUrgentAction')}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {t('ia.widget.allHealthy')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <section>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1 uppercase tracking-wide">
              <ShieldExclamationIcon className="w-3.5 h-3.5" /> {t('ia.widget.criticalAssets')}
            </h4>
            {biensCritiques.length > 0 ? (
              <div className="space-y-2">
                {biensCritiques.map((bien) => (
                  <div
                    key={bien.bien_id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-border-light dark:border-border-dark cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/biens/${bien.bien_id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/biens/${bien.bien_id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                          {bien.bien_designation}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {t('ia.widget.score')} <span className="font-bold">{bien.score}/100</span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {bien.recommandation}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${getStatusColor(bien.score)}`}
                      >
                        {bien.statut}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/biens/${bien.bien_id}`);
                        }}
                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                      >
                        {t('ia.widget.viewDetail')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ia/aide-decision?bien_id=${bien.bien_id}`);
                        }}
                        className="text-xs bg-success text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        {t('ia.widget.planAction')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">{t('ia.widget.noCriticalAsset')}</p>
            )}
          </section>

          <section>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1 uppercase tracking-wide">
              <ShoppingBagIcon className="w-3.5 h-3.5" /> {t('ia.widget.stockAlerts')}
            </h4>
            {alertesPieces.length > 0 ? (
              <div className="space-y-2">
                {alertesPieces.map((alerte) => (
                  <div
                    key={alerte.piece_id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-border-light dark:border-border-dark cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() =>
                      navigate(`/pieces?search=${encodeURIComponent(alerte.reference)}`)
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                          {alerte.designation}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {t('ia.widget.stock')} <span className="font-bold">{alerte.stock_actuel}</span> | {t('ia.widget.required')}{' '}
                          <span className="font-bold">{alerte.quantite_recommandee}</span>
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${getStatusColor(null, alerte.action)}`}
                      >
                        {alerte.action}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/pieces?search=${encodeURIComponent(alerte.reference)}`);
                        }}
                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                      >
                        {t('ia.widget.viewDetail')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/besoins/nouveau?piece_id=${alerte.piece_id}`);
                        }}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                      >
                        {t('ia.widget.addToNeed')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">{t('ia.widget.noStockAlert')}</p>
            )}
          </section>
        </div>
      )}
    </Card>
  );
};

export default IADecisionWidget;
