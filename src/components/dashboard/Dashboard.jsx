// frontend/src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  CpuChipIcon,
  ComputerDesktopIcon,
  ChartPieIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { dashboardService } from '../../services/dashboard';
import { pannesService } from '../../services/pannes';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { usePageActions } from '../../context/PageActionsContext';
import { downloadCsv } from '../../utils/exportCsv';
import IADecisionWidget from './widgets/IADecisionWidget';
import AssistantWidget from '../ia/AssistantWidget';
import DashboardAlerts from './DashboardAlerts';
import FournituresEnAttenteWidget from '../fournitures/FournituresEnAttenteWidget';
import BesoinsAttenteStockWidget from './BesoinsAttenteStockWidget';
import DashboardAmortissement from '../amortissements/DashboardAmortissement';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { t, lang } = useLanguage();
  const { registerActions, clearActions } = usePageActions();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pannesEnTest, setPannesEnTest] = useState(0);

  // Récupération des rôles utilisateur avec support chaînes et objets
  const userRoles = (user?.roles || []).map(r => (typeof r === 'string' ? r : r?.nom || '').toUpperCase());
  if (user?.role) {
    const mainRole = typeof user.role === 'string' ? user.role : user.role?.nom;
    if (mainRole) userRoles.push(mainRole.toUpperCase());
  }
  const isFinancialUser = userRoles.some(r => r.includes('COMPTABLE') || r.includes('DG') || r.includes('DIRECTEUR') || r.includes('ADMIN'));

  const roles = userRoles;
  const showFournitures = roles.some((r) => ['MAGASINIER', 'ADMIN'].includes(r));
  const showBesoinsStock = hasPermission('besoins.attente_stock.view');
  const showPannesTest = roles.some((r) => ['TECHNICIEN', 'ADMIN'].includes(r));

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (!showPannesTest) return;
    const load = async () => {
      try {
        const data = await pannesService.getMesPannes('EN_TEST');
        setPannesEnTest(Array.isArray(data) ? data.length : 0);
      } catch {
        setPannesEnTest(0);
      }
    };
    load();
  }, [showPannesTest]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSummary();
      setSummary(data || { total_biens: 0, pannes_en_cours: 0, statistiques_biens: {} });
      setError(null);
    } catch (err) {
      console.warn('Erreur chargement summary dashboard:', err);
      setSummary({ total_biens: 0, pannes_en_cours: 0, statistiques_biens: {} });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = useCallback(() => {
    if (!summary) return;
    const locale = lang === 'en' ? 'en-US' : 'fr-FR';
    const rows = [
      [t('totalAssets'), summary.total_biens || 0],
      [t('breakdownsInProgress'), summary.pannes_en_cours || 0],
      [t('vehicles'), summary.statistiques_biens?.vehicule || 0],
      [t('machines'), summary.statistiques_biens?.machine || 0],
      [t('computers'), summary.statistiques_biens?.ordinateur || 0],
    ];
    downloadCsv(
      [lang === 'en' ? 'Indicator' : 'Indicateur', lang === 'en' ? 'Value' : 'Valeur'],
      rows,
      `dashboard_${new Date().toISOString().slice(0, 10)}.csv`
    );
  }, [summary, lang, t]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    if (!summary) return;
    registerActions({ onExport: handleExport, onPrint: handlePrint });
    return () => clearActions();
  }, [summary, handleExport, handlePrint, registerActions, clearActions]);

  if (loading) {
    return <LoadingSpinner message={t('dashboardLoading')} />;
  }

  if (error) {
    return <div className="alert-error">{error}</div>;
  }

  const typeLabels = {
    vehicule: { label: t('vehicles'), icon: TruckIcon },
    machine: { label: t('machines'), icon: CpuChipIcon },
    ordinateur: { label: t('computers'), icon: ComputerDesktopIcon },
  };

  const pannesEnCours = summary?.pannes_en_cours || 0;
  const locale = lang === 'en' ? 'en-US' : 'fr-FR';

  return (
    <AppPage>
      <div className="print-area space-y-6">
      <div className="no-print">
      <PageHeader
        title={t('dashboardTitle')}
        subtitle={t('dashboardSubtitle')}
        icon={ChartPieIcon}
      />
      </div>

      <DashboardAlerts alertes={summary?.alertes} />

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showPannesTest ? 'lg:grid-cols-3' : ''} gap-4 w-full`}>
        <StatCard
          label={t('totalAssets')}
          value={summary?.total_biens || 0}
          icon={CubeIcon}
        />
        <StatCard
          label={t('breakdownsInProgress')}
          value={pannesEnCours}
          icon={WrenchScrewdriverIcon}
          accent={pannesEnCours > 0 ? 'danger' : 'default'}
          hint={pannesEnCours > 0 ? t('breakdownsHint') : undefined}
        />
        {showPannesTest && (
          <StatCard
            label="Pannes en phase de test"
            value={pannesEnTest}
            icon={BeakerIcon}
            accent={pannesEnTest > 0 ? 'warning' : 'default'}
            hint={pannesEnTest > 0 ? 'À confirmer depuis la fiche panne' : undefined}
          />
        )}
      </div>

      {(showFournitures || showBesoinsStock) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          {showFournitures && <FournituresEnAttenteWidget />}
          {showBesoinsStock && <BesoinsAttenteStockWidget />}
        </div>
      )}

      <div className="no-print app-content-grid">
        {hasPermission('ia.view') && <IADecisionWidget />}
        <Card title={t('fleetDistribution')} icon={<ChartPieIcon className="w-5 h-5" />} compact>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(typeLabels).map(([type, config]) => {
              const count = summary?.statistiques_biens?.[type] || 0;
              const TypeIcon = config.icon;
              return (
                <div
                  key={type}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-border-light dark:border-border-dark"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200 shrink-0">
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {config.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{count}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* TABLEAU DE BORD AMORTISSEMENT - UNIQUEMENT POUR COMPTABLES */}
      {/* ========================================================= */}
      {isFinancialUser && (
        <div className="no-print w-full">
          <DashboardAmortissement />
        </div>
      )}
      {/* ========================================================= */}

      <p className="no-print text-xs text-gray-400 dark:text-slate-500 text-center">
        {t('lastUpdate')}{' '}
        {new Date().toLocaleDateString(locale)} {lang === 'en' ? 'at' : 'à'}{' '}
        {new Date().toLocaleTimeString(locale)}
      </p>

      <div className="no-print">
      <AssistantWidget onFullPage={() => navigate('/ia/assistant')} />
      </div>
      </div>
    </AppPage>
  );
};

export default Dashboard;