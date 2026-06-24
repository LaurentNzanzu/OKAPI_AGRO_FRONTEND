import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenancesService } from '../../services/maintenances';
import { biensService } from '../../services/biens';
import { pannesService } from '../../services/pannes';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatPrice } from '../../utils/formatters';
import { StatutPanne, getStatutPanneColor, BADGE_COLORS } from '../../utils/workflowEnums';
import { getStatutPanneLabelI18n } from '../../utils/i18nWorkflow';
import {
    AppIcon,
    getMaintenanceTypeConfig,
    getMaintenanceStatutConfig,
    StatusBadge,
    WrenchScrewdriverIcon,
    ArrowLeftIcon,
    PlayIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    PencilSquareIcon,
} from '../ui/icons';

const FicheMaintenance = () => {
  const { t } = useTranslation();
  const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);
  const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);
  const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    
    const [maintenance, setMaintenance] = useState(null);
    const [bien, setBien] = useState(null);
    const [panne, setPanne] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTerminerForm, setShowTerminerForm] = useState(false);
    const [terminerData, setTerminerData] = useState({ rapport: '', cout: '', pieces_remplacees: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await maintenancesService.getById(id);
            setMaintenance(data);
            const bienData = await biensService.getById(data.id_bien);
            setBien(bienData);
            if (data.id_panne) {
                try {
                    const panneData = await pannesService.getById(data.id_panne);
                    setPanne(panneData);
                } catch {
                    setPanne(null);
                }
            } else {
                setPanne(null);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
            setError(t('maintenances.fiche.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleDemarrer = async () => {
        try {
            await maintenancesService.demarrer(id);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || t('maintenances.fiche.startError'));
        }
    };

    const handleTerminer = async (e) => {
        e.preventDefault();
        const isCorrective = maintenance.type_maintenance === 'CORRECTIVE' && maintenance.id_panne;
        if (isCorrective) {
            const ok = window.confirm(
                t('maintenances.fiche.closeConfirm')
            );
            if (!ok) return;
        }
        setSubmitting(true);
        try {
            await maintenancesService.terminer(id, {
                rapport: terminerData.rapport,
                cout: parseFloat(terminerData.cout),
                pieces_remplacees: terminerData.pieces_remplacees
            });
            setShowTerminerForm(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || t('maintenances.fiche.closeError'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAnnuler = async () => {
        if (window.confirm(t('maintenances.fiche.cancelConfirm'))) {
            try {
                await maintenancesService.annuler(id);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.detail || t('common.errors.generic'));
            }
        }
    };

    if (loading) {
        return <div className="text-center py-12">{t('maintenances.fiche.loading')}</div>;
    }

    if (error || !maintenance) {
        return <div className="text-center py-12 text-red-500">{error || t('maintenances.fiche.notFound')}</div>;
    }

    const typeInfo = maintenanceTypeConfig[maintenance.type_maintenance] || maintenanceTypeConfig.PREVENTIVE;
    const statutInfo = maintenanceStatutConfig[maintenance.statut] || maintenanceStatutConfig.PLANIFIEE;
    const isTechnicien = user?.roles?.some((r) => ['TECHNICIEN', 'ADMIN'].includes(r.toUpperCase()));
    const panneColorKey = panne ? getStatutPanneColor(panne.statut) : null;

    return (
        <div className="app-page">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold inline-flex items-center gap-2">
                        <AppIcon icon={WrenchScrewdriverIcon} size="md" />
                        {t('maintenances.fiche.title', { id: maintenance.id_maintenance })}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{maintenance.description}</p>
                </div>
                <button
                    onClick={() => navigate('/maintenances/planning')}
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-300 inline-flex items-center gap-1.5"
                >
                    <AppIcon icon={ArrowLeftIcon} size="sm" />
                    {t('maintenances.fiche.back')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {maintenance.type_maintenance === 'CORRECTIVE' && maintenance.id_panne && panne?.statut === StatutPanne.EN_TEST && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                            {t('maintenances.fiche.testPhaseInfo')}{' '}
                            <button type="button" className="underline font-medium" onClick={() => navigate(`/pannes/${maintenance.id_panne}`)}>
                                {t('maintenances.fiche.fichePanne')}
                            </button>.
                        </div>
                    )}
                    {maintenance.statut === 'TERMINEE' && panne && panne.statut !== StatutPanne.TERMINEE && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                            {t('maintenances.fiche.maintenanceDonePanneOpen')}{' '}
                            <button type="button" className="underline font-medium" onClick={() => navigate(`/pannes/${maintenance.id_panne}`)}>
                                {t('maintenances.fiche.confirmResolution')}
                            </button>
                        </div>
                    )}

                    {maintenance.id_panne && panne && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
                            <h2 className="text-lg font-semibold mb-4">{t('maintenances.fiche.panneAssociee')}</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500">{t('common.type')}:</span> {panne.type_panne || '—'}</div>
                                <div><span className="text-gray-500">{t('maintenances.fiche.priorite')}</span> {panne.priorite || '—'}</div>
                                <div>
                                    <span className="text-gray-500">{t('common.status')}:</span>{' '}
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${BADGE_COLORS[panneColorKey]}`}>
                                        {getStatutPanneLabelI18n(t, panne.statut)}
                                    </span>
                                </div>
                                <div>
                                    <button type="button" onClick={() => navigate(`/pannes/${maintenance.id_panne}`)} className="text-primary-600 hover:underline">
                                        {t('maintenances.fiche.voirFichePanne')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
                        <h2 className="text-lg font-semibold mb-4">{t('maintenances.fiche.infosGenerales')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-slate-400">{t('common.type')}</label>
                                <p className="font-medium mt-0.5">
                                    <StatusBadge label={typeInfo.label} Icon={typeInfo.Icon} color={typeInfo.color} />
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-slate-400">{t('common.status')}</label>
                                <p className="font-medium mt-0.5">
                                    <StatusBadge label={statutInfo.label} Icon={statutInfo.Icon} color={statutInfo.color} />
                                </p>
                            </div>
                            <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.bienConcerne')}</label><p className="font-medium">{bien?.marque || bien?.fabricant} {bien?.modele || ''}</p></div>
                            <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.technicien')}</label><p className="font-medium">{maintenance.technicien_nom || `ID: ${maintenance.id_technicien}`}</p></div>
                            <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.datePlanifiee')}</label><p className="font-medium">{formatDate(maintenance.date_planifiee)}</p></div>
                            {maintenance.date_debut_reelle && <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.debutReel')}</label><p className="font-medium">{formatDate(maintenance.date_debut_reelle)}</p></div>}
                            {maintenance.date_fin_reelle && <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.finReelle')}</label><p className="font-medium">{formatDate(maintenance.date_fin_reelle)}</p></div>}
                            {maintenance.periodicite_jours && <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.periodicite')}</label><p className="font-medium">{t('maintenances.fiche.periodiciteValue', { jours: maintenance.periodicite_jours })}</p></div>}
                            {maintenance.cout > 0 && <div><label className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.cout')}</label><p className="font-medium text-primary-600">{formatPrice(maintenance.cout)}</p></div>}
                        </div>
                    </div>

                    {maintenance.observation && (
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg border p-4">
                            <h3 className="font-medium mb-2 inline-flex items-center gap-2">
                                <AppIcon icon={PencilSquareIcon} size="sm" />
                                {t('maintenances.fiche.observations')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-300">{maintenance.observation}</p>
                        </div>
                    )}

                    {maintenance.rapport && (
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg border p-4">
                            <h3 className="font-medium mb-2 inline-flex items-center gap-2">
                                <AppIcon icon={DocumentTextIcon} size="sm" />
                                {t('maintenances.fiche.rapport')}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{maintenance.rapport}</p>
                            {maintenance.pieces_remplacees && (
                                <div className="mt-3 pt-3 border-t"><strong>{t('maintenances.fiche.piecesRemplacees')}</strong><p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{maintenance.pieces_remplacees}</p></div>
                            )}
                        </div>
                    )}
                </div>

                <div className="app-page">
                    {maintenance.statut === 'PLANIFIEE' && isTechnicien && (
                        <button onClick={handleDemarrer} className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-600 inline-flex items-center justify-center gap-2">
                            <AppIcon icon={PlayIcon} size="sm" className="text-white" />
                            {t('maintenances.fiche.demarrer')}
                        </button>
                    )}
                    {maintenance.statut === 'EN_COURS' && isTechnicien && (
                        <button onClick={() => setShowTerminerForm(true)} className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 inline-flex items-center justify-center gap-2">
                            <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />
                            {t('maintenances.fiche.terminer')}
                        </button>
                    )}
                    {maintenance.statut === 'PLANIFIEE' && isTechnicien && (
                        <button onClick={handleAnnuler} className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 inline-flex items-center justify-center gap-2">
                            <AppIcon icon={XCircleIcon} size="sm" className="text-white" />
                            {t('maintenances.fiche.annuler')}
                        </button>
                    )}
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-primary-500">{maintenance.cout > 0 ? formatPrice(maintenance.cout) : t('maintenances.fiche.nonFacture')}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('maintenances.fiche.coutTotal')}</div>
                    </div>
                </div>
            </div>

            {showTerminerForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-semibold mb-4">{t('maintenances.fiche.cloturerTitle')}</h3>
                        <form onSubmit={handleTerminer} className="space-y-4">
                            <div><label className="block font-medium mb-1">{t('maintenances.fiche.rapportLabel')}</label><textarea value={terminerData.rapport} onChange={(e) => setTerminerData({...terminerData, rapport: e.target.value})} required rows={3} className="w-full px-3 py-2 border rounded-lg"/></div>
                            <div><label className="block font-medium mb-1">{t('maintenances.fiche.coutLabel')}</label><input type="number" step="0.01" value={terminerData.cout} onChange={(e) => setTerminerData({...terminerData, cout: e.target.value})} required className="w-full px-3 py-2 border rounded-lg"/></div>
                            <div><label className="block font-medium mb-1">{t('maintenances.fiche.piecesLabel')}</label><textarea value={terminerData.pieces_remplacees} onChange={(e) => setTerminerData({...terminerData, pieces_remplacees: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder={t('maintenances.fiche.piecesPlaceholder')}/></div>
                            <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowTerminerForm(false)} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">{t('common.cancel')}</button><button type="submit" disabled={submitting} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">{submitting ? t('maintenances.fiche.validating') : t('common.validate')}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FicheMaintenance;
