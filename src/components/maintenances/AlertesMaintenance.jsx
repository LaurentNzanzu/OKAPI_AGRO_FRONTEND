// frontend/src/components/maintenances/AlertesMaintenance.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { maintenancesService } from '../../services/maintenances';
import { formatDate } from '../../utils/formatters';
import usePolling from '../../hooks/usePolling';
import {
  AppIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
} from '../ui/icons';

const AlertesMaintenance = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [alertes, setAlertes] = useState({ biens_critiques: [], maintenances_auto: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState({ nouvelle_date: '', motif: '' });
  const [submitting, setSubmitting] = useState(false);

  const chargerAlertes = async () => {
    try {
      setLoading(true);
      const data = await maintenancesService.getAlertesMaintenance();
      setAlertes(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
      setError(t('maintenances.alertes.loadError'));
    } finally {
      setLoading(false);
    }
  };

  usePolling(chargerAlertes, 60000);

  useEffect(() => {
    chargerAlertes();
  }, []);

  const getBadgeCouleur = (score) => {
    if (score === undefined || score === null) return 'bg-gray-400';
    if (score >= 60) return 'bg-green-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreColorClass = (score) => {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 60) return 'text-green-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score === undefined || score === null) return t('maintenances.alertes.notAvailable');
    if (score >= 60) return t('maintenances.alertes.good');
    if (score >= 30) return t('maintenances.alertes.monitoring');
    return t('maintenances.alertes.critical');
  };

  const getScoreIcon = (score) => {
    if (score === undefined || score === null) return ClockIcon;
    if (score >= 60) return CheckCircleIcon;
    if (score >= 30) return ClockIcon;
    return ExclamationTriangleIcon;
  };

  const getStatusBadge = (score) => {
    if (score === undefined || score === null) {
      return (
        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
          {t('maintenances.alertes.unknown')}
        </span>
      );
    }
    if (score < 30) {
      return (
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold animate-pulse">
          ⚠️ {t('maintenances.alertes.urgent')}
        </span>
      );
    }
    if (score < 60) {
      return (
        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm">
          🟡 {t('maintenances.alertes.monitoring')}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
        ✅ {t('maintenances.alertes.goodStatus')}
      </span>
    );
  };

  const handleReporter = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await maintenancesService.reporter(selectedMaintenance.id, {
        nouvelle_date: new Date(reportData.nouvelle_date).toISOString(),
        motif: reportData.motif
      });
      setShowReportForm(false);
      setSelectedMaintenance(null);
      setReportData({ nouvelle_date: '', motif: '' });
      chargerAlertes();
    } catch (err) {
      setError(err.response?.data?.detail || t('maintenances.alertes.reportError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnnuler = async (maintenance) => {
    if (window.confirm(t('maintenances.alertes.cancelConfirm', { description: maintenance.bien_designation || '' }))) {
      try {
        await maintenancesService.annuler(maintenance.id);
        chargerAlertes();
      } catch (err) {
        setError(err.response?.data?.detail || t('maintenances.alertes.cancelError'));
      }
    }
  };

  const totalBiensCritiques = alertes.biens_critiques?.length || 0;
  const totalMaintenancesAuto = alertes.maintenances_auto?.length || 0;
  const totalAlertes = totalBiensCritiques + totalMaintenancesAuto;

  if (loading && !alertes.biens_critiques.length) {
    return (
      <AppPage>
        <div className="flex justify-center items-center py-12">
          <div className="spinner w-8 h-8 border-4" />
          <span className="ml-3 text-gray-500 dark:text-slate-400">
            {t('maintenances.alertes.loading')}
          </span>
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
            <AppIcon icon={BellAlertIcon} size="lg" className="text-red-500" />
            {t('maintenances.alertes.title')}
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400 mt-1">
            {t('maintenances.alertes.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-bold">
            {totalAlertes > 0 
              ? t('maintenances.alertes.alertCountPlural', { count: totalAlertes })
              : t('maintenances.alertes.noAlertes')}
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/maintenances/nouveau')}
          >
            <AppIcon icon={PlusIcon} size="sm" />
            {t('maintenances.alertes.planifier')}
          </Button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="app-stats-grid">
        <StatCard
          label={t('maintenances.alertes.criticalAssets')}
          value={totalBiensCritiques}
          icon={ExclamationTriangleIcon}
          accent="danger"
          hint={t('maintenances.alertes.criticalAssetsHint')}
        />
        <StatCard
          label={t('maintenances.alertes.autoMaintenances')}
          value={totalMaintenancesAuto}
          icon={WrenchScrewdriverIcon}
          accent="warning"
          hint={t('maintenances.alertes.autoMaintenancesHint')}
        />
      </div>

      {/* Section 1: Biens Critiques sous Surveillance */}
      <Card
        title={t('maintenances.alertes.criticalAssetsTitle')}
        subtitle={t('maintenances.alertes.criticalAssetsSubtitle')}
        icon={<AppIcon icon={ExclamationTriangleIcon} size="md" className="text-red-500" />}
      >
        {alertes.biens_critiques?.length === 0 ? (
          <div className="empty-state">
            <AppIcon icon={CheckCircleIcon} size="lg" className="text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-slate-400">
              {t('maintenances.alertes.noCriticalAssets')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('maintenances.alertes.asset')}</th>
                  <th className="text-center">{t('maintenances.alertes.score')}</th>
                  <th className="text-center">{t('maintenances.alertes.status')}</th>
                  <th className="text-center">{t('maintenances.alertes.action')}</th>
                </tr>
              </thead>
              <tbody>
                {alertes.biens_critiques?.map((bien) => (
                  <tr key={bien.id}>
                    <td>
                      <div className="font-medium">{bien.designation}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">
                        ID: {bien.id}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getBadgeCouleur(bien.score_fiabilite)}`}>
                          {bien.score_fiabilite?.toFixed(1) || 'N/A'}%
                        </span>
                        <AppIcon 
                          icon={getScoreIcon(bien.score_fiabilite)} 
                          size="sm" 
                          className={getScoreColorClass(bien.score_fiabilite)} 
                        />
                      </div>
                    </td>
                    <td className="text-center">
                      {getStatusBadge(bien.score_fiabilite)}
                    </td>
                    <td className="text-center">
                      {bien.score_fiabilite < 30 && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => navigate(`/maintenances/nouveau?bienId=${bien.id}`)}
                        >
                          <AppIcon icon={PlusIcon} size="xs" />
                          {t('maintenances.alertes.planify')}
                        </Button>
                      )}
                      {bien.score_fiabilite >= 30 && bien.score_fiabilite < 60 && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => navigate(`/biens/${bien.id}`)}
                        >
                          <AppIcon icon={EyeIcon} size="xs" />
                          {t('maintenances.alertes.view')}
                        </Button>
                      )}
                      {bien.score_fiabilite >= 60 && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {t('maintenances.alertes.ok')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Section 2: Maintenances Préventives Auto-générées */}
      <Card
        title={t('maintenances.alertes.autoMaintenancesTitle')}
        icon={<AppIcon icon={WrenchScrewdriverIcon} size="md" className="text-blue-500" />}
      >
        {alertes.maintenances_auto?.length === 0 ? (
          <div className="empty-state">
            <AppIcon icon={CheckCircleIcon} size="lg" className="text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-slate-400">
              {t('maintenances.alertes.noAutoMaintenances')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('maintenances.alertes.asset')}</th>
                  <th className="text-center">{t('maintenances.alertes.plannedDate')}</th>
                  <th className="text-center">{t('maintenances.alertes.scoreSF')}</th>
                  <th className="text-center">{t('maintenances.alertes.status')}</th>
                  <th className="text-center">{t('maintenances.alertes.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {alertes.maintenances_auto?.map((maint) => (
                  <tr key={maint.id}>
                    <td>
                      <div className="font-medium">{maint.bien_designation}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">
                        ID: {maint.bien_id}
                      </div>
                    </td>
                    <td className="text-center">
                      {formatDate(maint.date_planifiee)}
                    </td>
                    <td className="text-center">
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getBadgeCouleur(maint.score_fiabilite_depart)}`}>
                        {maint.score_fiabilite_depart?.toFixed(1) || 'N/A'}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                        ⏳ {t('maintenances.alertes.planned')}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(`/maintenances/${maint.id}`)}
                        >
                          <AppIcon icon={EyeIcon} size="xs" />
                          {t('maintenances.alertes.view')}
                        </Button>
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => {
                            setSelectedMaintenance(maint);
                            setReportData({ nouvelle_date: new Date().toISOString().slice(0, 16), motif: '' });
                            setShowReportForm(true);
                          }}
                        >
                          <AppIcon icon={PencilSquareIcon} size="xs" />
                          {t('maintenances.alertes.report')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleAnnuler(maint)}
                        >
                          <AppIcon icon={TrashIcon} size="xs" />
                          {t('maintenances.alertes.cancel')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Reporter */}
      {showReportForm && selectedMaintenance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="app-card-header">
              <h3 className="text-lg font-semibold">
                {t('maintenances.alertes.reportTitle')}
              </h3>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setSelectedMaintenance(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="app-card-body">
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                {selectedMaintenance.bien_designation}
              </p>
              
              {error && (
                <div className="alert-error mb-4">{error}</div>
              )}

              <form onSubmit={handleReporter} className="space-y-4">
                <div>
                  <label className="form-label">
                    {t('maintenances.alertes.newDate')}
                  </label>
                  <input
                    type="datetime-local"
                    value={reportData.nouvelle_date}
                    onChange={(e) => setReportData({ ...reportData, nouvelle_date: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">
                    {t('maintenances.alertes.reason')}
                  </label>
                  <textarea
                    value={reportData.motif}
                    onChange={(e) => setReportData({ ...reportData, motif: e.target.value })}
                    rows={3}
                    className="form-input"
                    placeholder={t('maintenances.alertes.reasonPlaceholder')}
                  />
                </div>
                <div className="app-form-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowReportForm(false);
                      setSelectedMaintenance(null);
                      setError(null);
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                  >
                    {t('maintenances.alertes.confirmReport')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default AlertesMaintenance;