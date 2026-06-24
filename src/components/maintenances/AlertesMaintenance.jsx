import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useNavigate } from 'react-router-dom';
import { maintenancesService } from '../../services/maintenances';
import { formatDate, formatPrice } from '../../utils/formatters';
import usePolling from '../../hooks/usePolling';
import AccessibleClickable from '../common/AccessibleClickable';
import {
    AppIcon,
    getMaintenanceTypeConfig,
    getMaintenanceStatutConfig,
    StatusBadge,
    BellAlertIcon,
    ClockIcon,
    CheckCircleIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
} from '../ui/icons';

const AlertesMaintenance = () => {
  const { t } = useTranslation();
  const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);
  const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);
  const navigate = useNavigate();
    const [alertes, setAlertes] = useState([]);
    const [maintenancesRetard, setMaintenancesRetard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAlerte, setSelectedAlerte] = useState(null);
    const [showReporterForm, setShowReporterForm] = useState(false);
    const [reportData, setReportData] = useState({ nouvelle_date: '', motif: '' });
    const [submitting, setSubmitting] = useState(false);

    const getTypeInfo = (type) => maintenanceTypeConfig[type] || maintenanceTypeConfig.PREVENTIVE;
    const getStatutInfo = (statut) => maintenanceStatutConfig[statut] || maintenanceStatutConfig.PLANIFIEE;

    const fetchAlertes = useCallback(async () => {
        try {
            setLoading(true);
            const [aVenir, enRetard] = await Promise.all([
                maintenancesService.getAVenir(7),
                maintenancesService.getEnRetard()
            ]);
            setAlertes(aVenir || []);
            setMaintenancesRetard(enRetard || []);
        } catch (err) {
            console.error('Erreur chargement alertes:', err);
            setError(t('maintenances.alertes.loadError'));
        } finally {
            setLoading(false);
        }
    }, []);

    usePolling(fetchAlertes, 60000);

    const calculerJoursRestants = (datePlanifiee) => {
        const diff = new Date(datePlanifiee) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getLevel = (jours) => {
        if (jours < 0) return { level: 'critical', text: t('maintenances.alertes.levelCritical'), bg: 'bg-red-100 text-red-700' };
        if (jours === 0) return { level: 'urgent', text: t('maintenances.alertes.levelUrgent'), bg: 'bg-orange-100 text-orange-700' };
        if (jours <= 2) return { level: 'high', text: t('maintenances.alertes.levelHigh'), bg: 'bg-yellow-100 text-yellow-700' };
        if (jours <= 5) return { level: 'medium', text: t('maintenances.alertes.levelMedium'), bg: 'bg-primary-100 text-primary-600' };
        return { level: 'low', text: t('maintenances.alertes.levelLow'), bg: 'bg-green-100 text-green-700' };
    };

    const handleReporter = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await maintenancesService.reporter(selectedAlerte.id_maintenance, {
                nouvelle_date: new Date(reportData.nouvelle_date).toISOString(),
                motif: reportData.motif
            });
            setShowReporterForm(false);
            setSelectedAlerte(null);
            setReportData({ nouvelle_date: '', motif: '' });
            fetchAlertes();
        } catch (err) {
            let errorMsg = t('maintenances.alertes.reportError');
            if (err.response?.data?.detail) {
                errorMsg = err.response.data.detail;
            }
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAnnuler = async (maintenance) => {
        if (window.confirm(t('maintenances.alertes.cancelConfirm', { description: maintenance.description }))) {
            try {
                await maintenancesService.annuler(maintenance.id_maintenance);
                fetchAlertes();
            } catch (err) {
                setError(err.response?.data?.detail || t('maintenances.alertes.cancelError'));
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-gray-500 dark:text-slate-400">{t('maintenances.alertes.loading')}</span>
            </div>
        );
    }

    const totalAlertes = alertes.length + maintenancesRetard.length;

    return (
        <div className="app-page">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold inline-flex items-center gap-2">
                        <AppIcon icon={BellAlertIcon} size="md" />
                        {t('maintenances.alertes.title')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        {t('maintenances.alertes.subtitle')}
                    </p>
                </div>
                <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-4 py-2 rounded-full">
                    {totalAlertes > 1
                        ? t('maintenances.alertes.alertCountPlural', { count: totalAlertes })
                        : t('maintenances.alertes.alertCount', { count: totalAlertes })}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {maintenancesRetard.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-red-600 inline-flex items-center gap-2">
                        <AppIcon icon={ClockIcon} size="sm" />
                        {t('maintenances.alertes.enRetard', { count: maintenancesRetard.length })}
                    </h2>
                    {maintenancesRetard.map(m => {
                        const typeInfo = getTypeInfo(m.type_maintenance);
                        const statutInfo = getStatutInfo(m.statut);
                        const joursRetard = Math.abs(calculerJoursRestants(m.date_planifiee));
                        return (
                            <div key={m.id_maintenance} className="bg-white dark:bg-slate-900 border-l-4 border-red-500 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-start gap-3">
                                    <AccessibleClickable
                                        className="flex-1"
                                        onClick={() => navigate(`/maintenances/${m.id_maintenance}`)}
                                        ariaLabel={t('maintenances.alertes.viewMaintenance', { description: m.description })}
                                    >
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <StatusBadge label={typeInfo.label} Icon={typeInfo.Icon} color={typeInfo.color} />
                                            <StatusBadge label={statutInfo.label} Icon={statutInfo.Icon} color={statutInfo.color} />
                                            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                                                {joursRetard > 1
                                                    ? t('maintenances.alertes.retardPlural', { count: joursRetard })
                                                    : t('maintenances.alertes.retard', { count: joursRetard })}
                                            </span>
                                        </div>
                                        <p className="font-medium">{m.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{m.bien_designation || t('common.assetFallback', { id: m.id_bien })}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                                <AppIcon icon={CalendarDaysIcon} size="xs" />
                                                {t('maintenances.alertes.prevue')} {formatDate(m.date_planifiee)}
                                            </span>
                                            {m.cout > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <AppIcon icon={CurrencyDollarIcon} size="xs" />
                                                    {formatPrice(m.cout)}
                                                </span>
                                            )}
                                        </div>
                                    </AccessibleClickable>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedAlerte(m);
                                                setReportData({ nouvelle_date: new Date().toISOString().slice(0, 16), motif: '' });
                                                setShowReporterForm(true);
                                            }}
                                            className="px-3 py-1 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                        >
                                            {t('maintenances.alertes.reporter')}
                                        </button>
                                        <button
                                            onClick={() => handleAnnuler(m)}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            {t('maintenances.alertes.annuler')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {alertes.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-amber-600 inline-flex items-center gap-2">
                        <AppIcon icon={ClockIcon} size="sm" />
                        {t('maintenances.alertes.aVenir')}
                    </h2>
                    {alertes.map(m => {
                        const typeInfo = getTypeInfo(m.type_maintenance);
                        const statutInfo = getStatutInfo(m.statut);
                        const joursRestants = calculerJoursRestants(m.date_planifiee);
                        const level = getLevel(joursRestants);
                        return (
                            <div key={m.id_maintenance} className="bg-white dark:bg-slate-900 border-l-4 border-amber-500 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-start gap-3">
                                    <AccessibleClickable
                                        className="flex-1"
                                        onClick={() => navigate(`/maintenances/${m.id_maintenance}`)}
                                        ariaLabel={t('maintenances.alertes.viewMaintenance', { description: m.description })}
                                    >
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <StatusBadge label={typeInfo.label} Icon={typeInfo.Icon} color={typeInfo.color} />
                                            <StatusBadge label={statutInfo.label} Icon={statutInfo.Icon} color={statutInfo.color} />
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${level.bg}`}>
                                                {level.text}: {t('maintenances.planning.daysRemaining', { count: joursRestants })}
                                            </span>
                                        </div>
                                        <p className="font-medium">{m.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{m.bien_designation || t('common.assetFallback', { id: m.id_bien })}</p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                                <AppIcon icon={CalendarDaysIcon} size="xs" />
                                                {t('maintenances.alertes.prevue')} {formatDate(m.date_planifiee)}
                                            </span>
                                            {m.cout > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <AppIcon icon={CurrencyDollarIcon} size="xs" />
                                                    {formatPrice(m.cout)}
                                                </span>
                                            )}
                                        </div>
                                    </AccessibleClickable>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedAlerte(m);
                                                setReportData({ nouvelle_date: new Date().toISOString().slice(0, 16), motif: '' });
                                                setShowReporterForm(true);
                                            }}
                                            className="px-3 py-1 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                        >
                                            {t('maintenances.alertes.reporter')}
                                        </button>
                                        <button
                                            onClick={() => handleAnnuler(m)}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            {t('maintenances.alertes.annuler')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalAlertes === 0 && !loading && (
                <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                    <div className="mb-3 flex justify-center">
                        <AppIcon icon={CheckCircleIcon} size="lg" className="text-green-600 w-10 h-10" />
                    </div>
                    <p className="text-green-600 font-medium">{t('maintenances.alertes.noAlertes')}</p>
                    <p className="text-sm text-green-500 mt-1">{t('maintenances.alertes.allUpToDate')}</p>
                </div>
            )}

            {showReporterForm && selectedAlerte && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">{t('maintenances.alertes.reporterTitle')}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{selectedAlerte.description}</p>
                        
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
                        )}

                        <form onSubmit={handleReporter} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('maintenances.alertes.nouvelleDate')}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={reportData.nouvelle_date}
                                    onChange={(e) => setReportData({ ...reportData, nouvelle_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('maintenances.alertes.motifReport')}
                                </label>
                                <textarea
                                    value={reportData.motif}
                                    onChange={(e) => setReportData({ ...reportData, motif: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                    placeholder={t('maintenances.alertes.motifPlaceholder')}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReporterForm(false);
                                        setSelectedAlerte(null);
                                        setError(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {submitting ? t('maintenances.alertes.reporting') : t('maintenances.alertes.confirmReport')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertesMaintenance;