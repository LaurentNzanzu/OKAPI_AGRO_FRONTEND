import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { WrenchScrewdriverIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  getMaintenanceTypeConfig,
  getMaintenanceStatutConfig,
  StatusBadge,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
  PencilSquareIcon,
  PlayIcon,
  AppIcon,
} from '../ui/icons';
import { maintenancesService } from '../../services/maintenances';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import { usePageActions } from '../../context/PageActionsContext';
import { downloadCsv } from '../../utils/exportCsv';
import { formatDate, formatPrice } from '../../utils/formatters';

const ListeMaintenances = () => {
  const { t } = useTranslation();
  const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);
  const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);
  const navigate = useNavigate();
    const { bienId } = useParams();
    const { user } = useAuth();
    const { registerActions, clearActions } = usePageActions();
    const [maintenances, setMaintenances] = useState([]);
    const [bien, setBien] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statutFilter, setStatutFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [anneeFilter, setAnneeFilter] = useState(new Date().getFullYear());
    const [stats, setStats] = useState(null);

    const TYPE_LABELS = maintenanceTypeConfig;
    const STATUT_LABELS = maintenanceStatutConfig;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            let maintenancesData = [];
            
            if (bienId) {
                const bienData = await biensService.getById(bienId);
                setBien(bienData);
                maintenancesData = await maintenancesService.getByBienId(bienId);
            } else {
                const aVenir = await maintenancesService.getAVenir(365);
                const enRetard = await maintenancesService.getEnRetard();
                const allMaints = [...aVenir, ...enRetard];
                const uniqueMap = new Map();
                allMaints.forEach(m => uniqueMap.set(m.id_maintenance, m));
                maintenancesData = Array.from(uniqueMap.values());
            }
            
            setMaintenances(maintenancesData);
            const statsData = await maintenancesService.getStatistiques(anneeFilter);
            setStats(statsData);
        } catch (err) {
            console.error('Erreur chargement maintenances:', err);
            setError(t('maintenances.list.loadError'));
        } finally {
            setLoading(false);
        }
    }, [bienId, anneeFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getFilteredMaintenances = () => {
        let filtered = [...maintenances];
        
        if (statutFilter !== 'all') {
            filtered = filtered.filter(m => m.statut === statutFilter);
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter(m => m.type_maintenance === typeFilter);
        }
        if (anneeFilter) {
            filtered = filtered.filter(m => {
                const date = new Date(m.date_planifiee);
                return date.getFullYear() === anneeFilter;
            });
        }
        
        filtered.sort((a, b) => new Date(b.date_planifiee) - new Date(a.date_planifiee));
        return filtered;
    };

    const getStatutCount = (statut) => {
        return maintenances.filter(m => m.statut === statut).length;
    };

    const getTypeCount = (type) => {
        return maintenances.filter(m => m.type_maintenance === type).length;
    };

    const getCoutTotal = () => {
        return maintenances.reduce((sum, m) => sum + (m.cout || 0), 0);
    };

    const handleExport = useCallback(() => {
        const data = getFilteredMaintenances();
        const headers = [
            t('maintenances.list.colId'),
            t('maintenances.list.colBien'),
            t('maintenances.list.colType'),
            t('maintenances.list.colStatut'),
            t('maintenances.list.colDatePlanifiee'),
            t('maintenances.list.exportColDateDebut'),
            t('maintenances.list.exportColDateFin'),
            t('maintenances.list.colCout'),
            t('maintenances.list.exportColDescription'),
        ];
        const rows = data.map(m => [
            m.id_maintenance,
            m.bien_designation || m.id_bien,
            TYPE_LABELS[m.type_maintenance]?.label || m.type_maintenance,
            STATUT_LABELS[m.statut]?.label || m.statut,
            new Date(m.date_planifiee).toLocaleDateString('fr-FR'),
            m.date_debut_reelle ? new Date(m.date_debut_reelle).toLocaleDateString('fr-FR') : '-',
            m.date_fin_reelle ? new Date(m.date_fin_reelle).toLocaleDateString('fr-FR') : '-',
            m.cout || 0,
            m.description || '',
        ]);
        downloadCsv(headers, rows, `maintenances_${new Date().toISOString().slice(0, 10)}.csv`);
    }, [maintenances, statutFilter, typeFilter, anneeFilter, t, TYPE_LABELS, STATUT_LABELS]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    useEffect(() => {
        if (loading) return;
        registerActions({ onExport: handleExport, onPrint: handlePrint });
        return () => clearActions();
    }, [loading, handleExport, handlePrint, registerActions, clearActions]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-gray-500 dark:text-slate-400">{t('maintenances.list.loading')}</span>
            </div>
        );
    }

    const filteredMaintenances = getFilteredMaintenances();
    const coutTotal = getCoutTotal();

    return (
        <AppPage>
            <div className="no-print">
            <PageHeader
                title={bienId
                    ? t('maintenances.list.titleBien', { name: `${bien?.marque || bien?.fabricant || ''} ${bien?.modele || ''}`.trim() })
                    : t('maintenances.list.title')}
                subtitle={bienId ? t('maintenances.list.subtitleBien') : t('maintenances.list.subtitle')}
                icon={WrenchScrewdriverIcon}
                action={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="success" size="sm" onClick={handleExport}>
                            <ArrowDownTrayIcon className="w-4 h-4" /> {t('maintenances.list.exportCsv')}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handlePrint}>
                            <PrinterIcon className="w-4 h-4" /> {t('maintenances.list.print')}
                        </Button>
                    </div>
                }
            />

            {stats && !bienId && (
                <div className="app-stats-grid">
                    <StatCard label={t('maintenances.list.statTotal')} value={stats.total_maintenances || 0} icon={WrenchScrewdriverIcon} />
                    <StatCard label={t('maintenances.list.statTaux')} value={`${stats.taux_realisation || 0}%`} icon={CheckCircleIcon} accent="success" />
                    <StatCard label={t('maintenances.list.statRetard')} value={stats.alertes || 0} icon={ClockIcon} accent="warning" />
                    <StatCard label={t('maintenances.list.statPreventive')} value={stats.par_type?.PREVENTIVE || 0} icon={WrenchScrewdriverIcon} />
                </div>
            )}

            <Card compact>
                <div className="app-filter-bar">
                    <div className="flex flex-wrap gap-3 flex-1">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">{t('maintenances.list.filterStatut')}</label>
                            <select
                                value={statutFilter}
                                onChange={(e) => setStatutFilter(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">{t('maintenances.list.allStatuts')}</option>
                                <option value="PLANIFIEE">{STATUT_LABELS.PLANIFIEE.label} ({getStatutCount('PLANIFIEE')})</option>
                                <option value="EN_COURS">{STATUT_LABELS.EN_COURS.label} ({getStatutCount('EN_COURS')})</option>
                                <option value="TERMINEE">{STATUT_LABELS.TERMINEE.label} ({getStatutCount('TERMINEE')})</option>
                                <option value="REPORTEE">{STATUT_LABELS.REPORTEE.label} ({getStatutCount('REPORTEE')})</option>
                                <option value="ANNULEE">{STATUT_LABELS.ANNULEE.label} ({getStatutCount('ANNULEE')})</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">{t('maintenances.list.filterType')}</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">{t('maintenances.list.allTypes')}</option>
                                <option value="PREVENTIVE">{TYPE_LABELS.PREVENTIVE.label} ({getTypeCount('PREVENTIVE')})</option>
                                <option value="CORRECTIVE">{TYPE_LABELS.CORRECTIVE.label} ({getTypeCount('CORRECTIVE')})</option>
                                <option value="PREDICTIVE">{TYPE_LABELS.PREDICTIVE.label} ({getTypeCount('PREDICTIVE')})</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">{t('maintenances.list.filterAnnee')}</label>
                            <select
                                value={anneeFilter}
                                onChange={(e) => setAnneeFilter(parseInt(e.target.value))}
                                className="form-input"
                            >
                                <option value={2023}>2023</option>
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                            </select>
                        </div>
                    </div>
                    <div className="text-sm font-medium shrink-0 md:ml-auto">
                        {t('maintenances.list.coutTotal')} <span className="text-petrol font-bold">{formatPrice(coutTotal)}</span>
                    </div>
                </div>
            </Card>
            </div>

            {error && (
                <div className="no-print alert-error">
                    {error}
                </div>
            )}

            {filteredMaintenances.length === 0 ? (
                <div className="no-print text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-slate-400">{t('maintenances.list.empty')}</p>
                    {user?.role?.nom === 'TECHNICIEN' && bienId && (
                        <button
                            onClick={() => navigate(`/maintenances/nouveau?bien_id=${bienId}`)}
                            className="text-primary-500 mt-2 inline-block"
                        >
                            {t('maintenances.list.planAction')}
                        </button>
                    )}
                </div>
            ) : (
                <Card noPadding className="print-area">
                <div className="app-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('maintenances.list.colId')}</th>
                                {!bienId && <th>{t('maintenances.list.colBien')}</th>}
                                <th>{t('maintenances.list.colType')}</th>
                                <th>{t('maintenances.list.colStatut')}</th>
                                <th>{t('maintenances.list.colDatePlanifiee')}</th>
                                <th>{t('maintenances.list.colPeriode')}</th>
                                <th>{t('maintenances.list.colCout')}</th>
                                <th className="text-center print-hide-col">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMaintenances.map(m => {
                                const typeInfo = TYPE_LABELS[m.type_maintenance] || TYPE_LABELS.PREVENTIVE;
                                const statutInfo = STATUT_LABELS[m.statut] || STATUT_LABELS.PLANIFIEE;
                                return (
                                    <tr 
                                        key={m.id_maintenance} 
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/maintenances/${m.id_maintenance}`)}
                                    >
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-slate-400">#{m.id_maintenance}</td>
                                        {!bienId && (
                                            <td className="px-4 py-3 text-sm">
                                                {m.bien_designation || t('common.assetFallback', { id: m.id_bien })}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <StatusBadge label={typeInfo.label} Icon={typeInfo.Icon} color={typeInfo.color} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge label={statutInfo.label} Icon={statutInfo.Icon} color={statutInfo.color} />
                                        </td>
                                        <td className="px-4 py-3 text-sm">{formatDate(m.date_planifiee)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {m.date_debut_reelle && (
                                                <div className="flex items-center gap-1 text-gray-600 dark:text-slate-300">
                                                    <AppIcon icon={PlayIcon} size="xs" /> {formatDate(m.date_debut_reelle)}
                                                </div>
                                            )}
                                            {m.date_fin_reelle && (
                                                <div className="flex items-center gap-1 text-gray-600 dark:text-slate-300">
                                                    <AppIcon icon={CheckCircleIcon} size="xs" /> {formatDate(m.date_fin_reelle)}
                                                </div>
                                            )}
                                            {!m.date_debut_reelle && m.statut === 'PLANIFIEE' && (
                                                <div className="text-gray-400 dark:text-slate-500">{t('maintenances.list.notStarted')}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">{formatPrice(m.cout)}</td>
                                        <td className="px-4 py-3 text-center print-hide-col">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/maintenances/${m.id_maintenance}`);
                                                    }}
                                                    className="p-1.5 text-primary-600 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800 rounded"
                                                    title={t('maintenances.list.viewDetails')}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                {m.statut === 'PLANIFIEE' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/maintenances/${m.id_maintenance}/modifier`);
                                                        }}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
                                                        title={t('maintenances.list.edit')}
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                </Card>
            )}
        </AppPage>
    );
};

export default ListeMaintenances;