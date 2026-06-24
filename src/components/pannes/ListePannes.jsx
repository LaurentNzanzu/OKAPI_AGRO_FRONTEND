import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  getPanneStatutConfig,
  PANNE_TYPE_CONFIG,
  PANNE_PRIORITE_CONFIG,
  StatusBadge,
  EyeIcon,
} from '../ui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { pannesService } from '../../services/pannes';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import { usePageActions } from '../../context/PageActionsContext';
import { useTranslation } from '../../context/LanguageContext';
import { downloadCsv } from '../../utils/exportCsv';
import { formatDate, formatPrice } from '../../utils/formatters';

const ListePannes = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { bienId } = useParams();
    const { user } = useAuth();
    const { registerActions, clearActions } = usePageActions();

    const panneStatutConfig = useMemo(() => getPanneStatutConfig(t), [t]);

    const TYPE_LABELS = useMemo(() => ({
        MECANIQUE: { ...PANNE_TYPE_CONFIG.MECANIQUE, label: t('pannes.typeMecanique') },
        ELECTRIQUE: { ...PANNE_TYPE_CONFIG.ELECTRIQUE, label: t('pannes.typeElectrique') },
        ELECTRONIQUE: { ...PANNE_TYPE_CONFIG.ELECTRONIQUE, label: t('pannes.typeElectronique') },
        LOGICIELLE: { ...PANNE_TYPE_CONFIG.LOGICIELLE, label: t('pannes.typeLogicielle') },
        STRUCTURELLE: { ...PANNE_TYPE_CONFIG.STRUCTURELLE, label: t('pannes.typeStructurelle') },
        AUTRE: PANNE_TYPE_CONFIG.AUTRE,
    }), [t]);

    const PRIORITE_LABELS = useMemo(() => ({
        BASSE: { ...PANNE_PRIORITE_CONFIG.BASSE, label: t('pannes.prioriteBasse') },
        MOYENNE: { ...PANNE_PRIORITE_CONFIG.MOYENNE, label: t('pannes.prioriteMoyenne') },
        HAUTE: { ...PANNE_PRIORITE_CONFIG.HAUTE, label: t('pannes.prioriteHaute') },
        CRITIQUE: { ...PANNE_PRIORITE_CONFIG.CRITIQUE, label: t('pannes.prioriteCritique') },
    }), [t]);
    
    const [pannes, setPannes] = useState([]);
    const [bien, setBien] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statutFilter, setStatutFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [prioriteFilter, setPrioriteFilter] = useState('all');

    const fetchPannes = useCallback(async () => {
        try {
            setLoading(true);
            let data;
            
            if (bienId) {
                const bienData = await biensService.getById(bienId);
                setBien(bienData);
                data = await pannesService.getByBienId(bienId);
            } else {
                const isTechnicien = user?.roles?.some(r => r.toUpperCase() === 'TECHNICIEN');
                if (isTechnicien) {
                    data = await pannesService.getMesPannes();
                } else {
                    data = await pannesService.getActives();
                }
            }
            
            setPannes(data || []);
        } catch (err) {
            console.error('Erreur chargement pannes:', err);
            setError(t('pannes.loadError'));
        } finally {
            setLoading(false);
        }
    }, [bienId, user, t]);

    useEffect(() => {
        fetchPannes();
    }, [fetchPannes]);

    const getFilteredPannes = () => {
        let filtered = [...pannes];
        
        if (statutFilter !== 'all') {
            filtered = filtered.filter(p => p.statut === statutFilter);
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter(p => p.type_panne === typeFilter);
        }
        if (prioriteFilter !== 'all') {
            filtered = filtered.filter(p => p.priorite === prioriteFilter);
        }
        
        filtered.sort((a, b) => new Date(b.date_declaration) - new Date(a.date_declaration));
        return filtered;
    };

    const getStatutCount = (statut) => pannes.filter(p => p.statut === statut).length;

    const getCoutTotal = () => pannes.reduce((sum, p) => sum + (p.cout_total_reparation || 0), 0);

    const handleExport = useCallback(() => {
        const data = getFilteredPannes();
        const headers = [t('pannes.colId'), t('pannes.colAsset'), t('pannes.colType'), t('pannes.colStatut'), t('pannes.colPriority'), t('pannes.colDate'), t('pannes.colCost')];
        const rows = data.map((p) => [
            p.id_panne,
            p.bien_designation || p.id_bien,
            TYPE_LABELS[p.type_panne]?.label || p.type_panne,
            panneStatutConfig[p.statut]?.label || p.statut,
            PRIORITE_LABELS[p.priorite]?.label || p.priorite,
            formatDate(p.date_declaration),
            p.cout_total_reparation || 0,
        ]);
        downloadCsv(headers, rows, `pannes_${new Date().toISOString().slice(0, 10)}.csv`);
    }, [pannes, statutFilter, typeFilter, prioriteFilter, t, TYPE_LABELS, PRIORITE_LABELS, panneStatutConfig]);

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
                <span className="ml-2 text-gray-500 dark:text-slate-400">{t('loading')}</span>
            </div>
        );
    }

    const filteredPannes = getFilteredPannes();
    const coutTotal = getCoutTotal();
    const bienName = `${bien?.marque || bien?.fabricant || ''} ${bien?.modele || ''}`.trim();

    return (
        <AppPage>
            <div className="no-print">
            <PageHeader
                title={bienId ? t('pannes.listTitleBien', { name: bienName }) : t('pannes.listTitle')}
                subtitle={bienId ? t('pannes.listSubtitleBien') : t('pannes.listSubtitle')}
                icon={ExclamationTriangleIcon}
                action={
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm w-full sm:w-auto"
                    >
                        {t('print')}
                    </button>
                }
            />

            <div className="app-stats-grid">
                {[
                    { label: t('pannes.totalPannes'), value: pannes.length, cls: 'text-primary-600' },
                    { label: t('pannes.statutEnCours'), value: getStatutCount('EN_COURS'), cls: 'text-orange-500' },
                    { label: t('pannes.prioriteCritique'), value: getStatutCount('CRITIQUE'), cls: 'text-danger' },
                    { label: t('pannes.statutTerminee'), value: getStatutCount('TERMINEE'), cls: 'text-success' },
                ].map((s) => (
                    <div key={s.label} className="app-card app-card-body-compact text-center">
                        <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</div>
                    </div>
                ))}
                <div className="app-card app-card-body-compact text-center sm:col-span-2 xl:col-span-1">
                    <div className="text-lg font-bold text-primary-600 truncate">{formatPrice(coutTotal)}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t('pannes.totalCost')}</div>
                </div>
            </div>

            <Card compact>
                <div className="app-filter-bar">
                    <div className="app-filter-field">
                            <label className="form-label">{t('pannes.filterStatut')}</label>
                            <select
                                value={statutFilter}
                                onChange={(e) => setStatutFilter(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">{t('pannes.allStatuts')}</option>
                                <option value="DECLAREE">{t('pannes.statutDeclaree')} ({getStatutCount('DECLAREE')})</option>
                                <option value="DIAGNOSTIQUEE">{t('pannes.statutDiagnostiquee')} ({getStatutCount('DIAGNOSTIQUEE')})</option>
                                <option value="EN_ATTENTE_PIECES">{t('pannes.statutAttentePieces')} ({getStatutCount('EN_ATTENTE_PIECES')})</option>
                                <option value="EN_VALIDATION">{t('pannes.statutEnValidation')} ({getStatutCount('EN_VALIDATION')})</option>
                                <option value="EN_COURS">{t('pannes.statutEnCours')} ({getStatutCount('EN_COURS')})</option>
                                <option value="TERMINEE">{t('pannes.statutTerminee')} ({getStatutCount('TERMINEE')})</option>
                            </select>
                        </div>
                    <div className="app-filter-field">
                            <label className="form-label">{t('pannes.filterType')}</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">{t('pannes.allTypes')}</option>
                                <option value="MECANIQUE">{t('pannes.typeMecanique')}</option>
                                <option value="ELECTRIQUE">{t('pannes.typeElectrique')}</option>
                                <option value="ELECTRONIQUE">{t('pannes.typeElectronique')}</option>
                                <option value="LOGICIELLE">{t('pannes.typeLogicielle')}</option>
                                <option value="STRUCTURELLE">{t('pannes.typeStructurelle')}</option>
                            </select>
                        </div>
                    <div className="app-filter-field">
                            <label className="form-label">{t('pannes.filterPriorite')}</label>
                            <select
                                value={prioriteFilter}
                                onChange={(e) => setPrioriteFilter(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">{t('pannes.allPriorites')}</option>
                                <option value="BASSE">{t('pannes.prioriteBasse')}</option>
                                <option value="MOYENNE">{t('pannes.prioriteMoyenne')}</option>
                                <option value="HAUTE">{t('pannes.prioriteHaute')}</option>
                                <option value="CRITIQUE">{t('pannes.prioriteCritique')}</option>
                            </select>
                        </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300 self-center">
                        {t('pannes.totalCost')} : <span className="text-primary-600 font-bold">{formatPrice(coutTotal)}</span>
                    </p>
                </div>
            </Card>
            </div>

            {error && <div className="no-print alert-error">{error}</div>}

            <Card noPadding className="print-area">
            {filteredPannes.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <p className="text-gray-500 dark:text-slate-400">{t('pannes.emptyList')}</p>
                    {user?.roles?.some(r => r.toUpperCase() === 'TECHNICIEN') && (
                        <button
                            type="button"
                            onClick={() => navigate('/pannes/declarer')}
                            className="text-primary-600 mt-2 inline-block text-sm font-medium hover:underline"
                        >
                            {t('pannes.declareLink')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="app-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('pannes.colId')}</th>
                                {!bienId && <th>{t('pannes.colAsset')}</th>}
                                <th>{t('pannes.colType')}</th>
                                <th>{t('pannes.colStatut')}</th>
                                <th>{t('pannes.colPriority')}</th>
                                <th>{t('pannes.colDate')}</th>
                                <th>{t('pannes.colCost')}</th>
                                <th className="text-center print-hide-col">{t('pannes.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPannes.map(p => {
                                const typeInfo = TYPE_LABELS[p.type_panne] || TYPE_LABELS.AUTRE;
                                const statutInfo = panneStatutConfig[p.statut] || panneStatutConfig.DECLAREE;
                                const prioriteInfo = PRIORITE_LABELS[p.priorite] || PRIORITE_LABELS.MOYENNE;
                                return (
                                    <tr 
                                        key={p.id_panne} 
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/pannes/${p.id_panne}`)}
                                    >
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-slate-400">#{p.id_panne}</td>
                                        {!bienId && (
                                            <td className="px-4 py-3 text-sm">
                                                {p.bien_designation || t('pannes.assetPrefix', { id: p.id_bien })}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <StatusBadge label={typeInfo.label} Icon={typeInfo.Icon} color={typeInfo.color} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge label={statutInfo.label} Icon={statutInfo.Icon} color={statutInfo.color} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge label={prioriteInfo.label} Icon={prioriteInfo.Icon} color={prioriteInfo.color} />
                                        </td>
                                        <td className="px-4 py-3 text-sm">{formatDate(p.date_declaration)}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{formatPrice(p.cout_total_reparation)}</td>
                                        <td className="px-4 py-3 text-center print-hide-col">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/pannes/${p.id_panne}`);
                                                }}
                                                className="p-1.5 text-primary-600 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800 rounded"
                                                title={t('pannes.viewDetails')}
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            </Card>
        </AppPage>
    );
};

export default ListePannes;
