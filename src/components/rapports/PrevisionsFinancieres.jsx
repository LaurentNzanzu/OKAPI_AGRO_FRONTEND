// frontend/src/components/rapports/PrevisionsFinancieres.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import { rapportsService } from '../../services/rapports';
import { formatPrice } from '../../utils/formatters';
import {
  AppIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  ArrowTrendingDownIcon,
} from '../ui/icons';

// Import de recharts pour le graphique
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const PrevisionsFinancieres = () => {
  const { t } = useTranslation();
  const [projections, setProjections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chargerProjections();
  }, []);

  const chargerProjections = async () => {
    try {
      setLoading(true);
      const data = await rapportsService.getProjections();
      setProjections(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement projections:', err);
      setError(err.response?.data?.detail || t('previsions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour le graphique
  const chartData = projections?.projections?.map(p => ({
    année: p.annee,
    budget: Number((p.budget_requis / 1000000).toFixed(2)),
    biens: p.nb_biens,
    label: `${p.annee}`,
  })) || [];

  // Trouver les statistiques
  const maxBudget = Math.max(...chartData.map(d => d.budget));
  const anneeMax = chartData.find(d => d.budget === maxBudget);
  const totalBiens = projections?.projections?.reduce((sum, p) => sum + p.nb_biens, 0) || 0;
  const totalBudget = projections?.total_5_ans || 0;

  // Couleurs pour le graphique
  const getBarColor = (budget, max) => {
    if (budget === max && budget > 0) return '#EF4444';
    if (budget > max * 0.7) return '#F59E0B';
    return '#3B82F6';
  };

  if (loading) {
    return (
      <AppPage>
        <div className="flex justify-center items-center py-12">
          <div className="spinner w-8 h-8 border-4" />
          <span className="ml-3 text-gray-500 dark:text-slate-400">
            {t('previsions.loading')}
          </span>
        </div>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage>
        <div className="alert-error">{error}</div>
      </AppPage>
    );
  }

  if (!projections) {
    return (
      <AppPage>
        <div className="empty-state">
          <AppIcon icon={ChartBarIcon} size="lg" className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-slate-400">
            {t('previsions.noData')}
          </p>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      {/* En-tête */}
      <div className="app-page-header">
        <div>
          <h1 className="text-page-title inline-flex items-center gap-3">
            <AppIcon icon={ChartBarIcon} size="lg" className="text-blue-600" />
            {t('previsions.title')}
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400 mt-1">
            {t('previsions.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <AppIcon icon={CalendarDaysIcon} size="sm" />
          {t('previsions.baseYear')}: {projections.annee_base}
        </div>
      </div>

      {/* Stats */}
      <div className="app-stats-grid">
        <StatCard
          label={t('previsions.totalBudget')}
          value={formatPrice(totalBudget)}
          icon={CurrencyDollarIcon}
          accent={totalBudget > 50000000 ? 'danger' : 'default'}
        />
        <StatCard
          label={t('previsions.totalAssets')}
          value={totalBiens}
          icon={BuildingOffice2Icon}
        />
        <StatCard
          label={t('previsions.yearPeak')}
          value={anneeMax ? anneeMax.année : '-'}
          icon={ArrowTrendingDownIcon}
          accent="warning"
        />
        <StatCard
          label={t('previsions.avgPerYear')}
          value={formatPrice(totalBudget / 5)}
          icon={ChartBarIcon}
        />
      </div>

      {/* Graphique */}
      <Card
        title={t('previsions.chartTitle')}
        icon={<AppIcon icon={ChartBarIcon} size="md" className="text-blue-500" />}
      >
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis 
                dataKey="année" 
                tick={{ fontSize: 12 }}
                label={{ value: t('previsions.year'), position: 'bottom', offset: 0 }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}M`}
                label={{ 
                  value: t('previsions.millionsFCFA'), 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
              />
              <Tooltip 
                formatter={(value) => [`${(value * 1000000).toLocaleString()} FCFA`, t('previsions.budget')]}
                labelFormatter={(label) => `${t('previsions.year')} ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
              />
              <Bar 
                dataKey="budget" 
                name={t('previsions.budgetMillions')}
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.budget, maxBudget)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Détails par année */}
      <div className="app-content-grid-3">
        {projections.projections.map((proj) => (
          <Card key={proj.annee} compact>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {t('previsions.year')} {proj.annee}
                </h4>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {formatPrice(proj.budget_requis)}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {proj.nb_biens} {t('previsions.assetsToReplace')}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                proj.budget_requis === 0 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : proj.budget_requis > 10000000
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {proj.budget_requis === 0 
                  ? <span className="flex items-center gap-1"><AppIcon icon={CheckCircleIcon} size="xs" /> {t('previsions.ok')}</span>
                  : proj.budget_requis > 10000000
                  ? <span className="flex items-center gap-1"><AppIcon icon={ExclamationTriangleIcon} size="xs" /> {t('previsions.high')}</span>
                  : <span className="flex items-center gap-1"><AppIcon icon={ChartBarIcon} size="xs" /> {t('previsions.medium')}</span>
                }
              </div>
            </div>
            {proj.details && proj.details.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
                  {t('previsions.showDetails')} ({proj.details.length})
                </summary>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {proj.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                      <span>{detail.designation}</span>
                      <span className="text-gray-600 dark:text-gray-400">{formatPrice(detail.cout_remplacement)}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </Card>
        ))}
      </div>

      {/* Alerte et recommandations */}
      {totalBudget > 50000000 && (
        <Card
          title={t('previsions.alertTitle')}
          icon={<AppIcon icon={ExclamationTriangleIcon} size="md" className="text-red-500" />}
          className="border-2 border-red-300 dark:border-red-700"
        >
          <div className="flex items-start gap-4">
            <AppIcon icon={ExclamationTriangleIcon} size="lg" className="text-red-500 mt-1" />
            <div>
              <p className="font-bold text-red-700 dark:text-red-300">
                {t('previsions.alertMessage')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {t('previsions.alertDetail', { amount: formatPrice(totalBudget) })}
              </p>
              {anneeMax && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  🔴 {t('previsions.peakYear')}: {anneeMax.année} ({anneeMax.budget.toFixed(1)} M FCFA)
                </p>
              )}
              <div className="mt-3 flex gap-3">
                <button className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  {t('previsions.planFinancing')}
                </button>
                <button className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                  {t('previsions.exportReport')}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recommandations */}
      {projections.recommandations && projections.recommandations.length > 0 && (
        <Card
          title={t('previsions.recommendations')}
          icon={<AppIcon icon={CheckCircleIcon} size="md" className="text-green-500" />}
        >
          <div className="space-y-2">
            {projections.recommandations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                  rec.priorite === 'HAUTE' ? 'bg-red-500' :
                  rec.priorite === 'MOYENNE' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {rec.priorite}
                </span>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{rec.message}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {t('previsions.budget')}: {formatPrice(rec.budget_estime)} - {rec.nombre_biens} {t('previsions.assets')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppPage>
  );
};

export default PrevisionsFinancieres;