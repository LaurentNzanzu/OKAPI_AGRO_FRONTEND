// frontend/src/components/rapports/PrevisionsFinancieres.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import rapportsService from '../../services/rapports';
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

// Import de ChartJS et react-chartjs-2 pour le graphique
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { Bar as BarChartComponent } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, ChartTooltip, ChartLegend);

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
      console.log('📊 Données projections reçues:', data); // ✅ Debug
      setProjections(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement projections:', err);
      setError(err.response?.data?.detail || t('previsions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sécuriser l'accès aux données
  const getProjectionsList = () => {
    if (!projections) return [];
    // Si la réponse est un tableau directement
    if (Array.isArray(projections)) return projections;
    // Si la réponse a une propriété 'projections'
    if (projections.projections && Array.isArray(projections.projections)) {
      return projections.projections;
    }
    // Si la réponse a une propriété 'data'
    if (projections.data && Array.isArray(projections.data)) {
      return projections.data;
    }
    return [];
  };

  const projectionsList = getProjectionsList();

  // Préparer les données pour le graphique
  const chartData = projectionsList.map(p => ({
    année: p.annee || p.année || p.year,
    budget: Number(((p.budget_requis || p.budget || 0) / 1000000).toFixed(2)),
    biens: p.nb_biens || p.biens || 0,
    label: `${p.annee || p.année || p.year || ''}`,
  })) || [];

  // Trouver les statistiques
  const maxBudget = chartData.length > 0 ? Math.max(...chartData.map(d => d.budget)) : 0;
  const anneeMax = chartData.find(d => d.budget === maxBudget);
  const totalBiens = projectionsList.reduce((sum, p) => sum + (p.nb_biens || p.biens || 0), 0);
  const totalBudget = projections?.total_5_ans || projectionsList.reduce((sum, p) => sum + (p.budget_requis || p.budget || 0), 0);

  // Couleurs pour le graphique
  const getBarColor = (budget, max) => {
    if (budget === max && budget > 0) return '#EF4444';
    if (budget > max * 0.7) return '#F59E0B';
    return '#3B82F6';
  };

  const chartJsData = {
    labels: chartData.map(d => String(d.année)),
    datasets: [
      {
        label: t('previsions.budgetMillions') || 'Budget Requis (Millions USD)',
        data: chartData.map(d => d.budget),
        backgroundColor: chartData.map(d => getBarColor(d.budget, maxBudget)),
        borderRadius: 6,
      }
    ]
  };

  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${(context.raw * 1000000).toLocaleString()} USD`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `${value}M`
        }
      }
    }
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

  if (!projections || projectionsList.length === 0) {
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
          {t('previsions.baseYear')}: {projections.annee_base || projections.annee || new Date().getFullYear()}
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
          <BarChartComponent data={chartJsData} options={chartJsOptions} />
        </div>
      </Card>

      {/* Détails par année */}
      <div className="app-content-grid-3">
        {projectionsList.map((proj) => {
          const annee = proj.annee || proj.année || proj.year;
          const budget = proj.budget_requis || proj.budget || 0;
          const nbBiens = proj.nb_biens || proj.biens || 0;
          const details = proj.details || [];

          return (
            <Card key={annee} compact>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400">
                    {t('previsions.year')} {annee}
                  </h4>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatPrice(budget)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {nbBiens} {t('previsions.assetsToReplace')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  budget === 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : budget > 10000000
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {budget === 0 
                    ? <span className="flex items-center gap-1"><AppIcon icon={CheckCircleIcon} size="xs" /> {t('previsions.ok')}</span>
                    : budget > 10000000
                    ? <span className="flex items-center gap-1"><AppIcon icon={ExclamationTriangleIcon} size="xs" /> {t('previsions.high')}</span>
                    : <span className="flex items-center gap-1"><AppIcon icon={ChartBarIcon} size="xs" /> {t('previsions.medium')}</span>
                  }
                </div>
              </div>
              {details && details.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
                    {t('previsions.showDetails')} ({details.length})
                  </summary>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                        <span>{detail.designation || detail.bien_designation || `Bien ${detail.bien_id}`}</span>
                        <span className="text-gray-600 dark:text-gray-400">{formatPrice(detail.cout_remplacement || detail.cout || 0)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </Card>
          );
        })}
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
                  🔴 {t('previsions.peakYear')}: {anneeMax.année} ({anneeMax.budget.toFixed(1)} M USD)
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