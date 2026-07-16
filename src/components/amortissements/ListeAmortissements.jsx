import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { amortissementsService } from '../../services/amortissements';
import { formatPrice } from '../../utils/formatters';
import ClotureExercice from './ClotureExercice';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

const getMethodeLabels = (t) => ({
    LINEAIRE: t('amortissements.list.methodeLineaire'),
    DEGRESSIF: t('amortissements.list.methodeDegressif'),
    UNITE_PRODUCTION: t('amortissements.list.methodeUniteProduction'),
    COMPOSANTS: t('amortissements.list.methodeComposants'),
    SPECIFIQUE_OKAPI: t('amortissements.list.methodeOkapi'),
});

const ListeAmortissements = ({ bienId }) => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [filterAnnee, setFilterAnnee] = useState('');
    const [filterMethode, setFilterMethode] = useState('');
    const [anneesDisponibles, setAnneesDisponibles] = useState([]);
    const [statistiques, setStatistiques] = useState(null);
    const [showCloture, setShowCloture] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const canCloture = user?.roles?.some((r) => ['COMPTABLE', 'ADMIN', 'DG'].includes(r.toUpperCase()));

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (bienId) {
                const result = await amortissementsService.getByBien(bienId);
                setData(Array.isArray(result) ? result : []);
                setStatistiques(null);
            } else {
                const [listResult, statsResult] = await Promise.all([
                    amortissementsService.getAll(),
                    amortissementsService.getStatistics(),
                ]);
                setData(Array.isArray(listResult) ? listResult : []);
                setStatistiques(statsResult);
            }
        } catch (err) {
            console.error('Erreur chargement amortissements:', err);
            setData([]);
            setStatistiques(null);
            setError(err.response?.data?.detail || t('amortissements.list.loadError'));
        } finally {
            setLoading(false);
        }
    }, [bienId, t]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (data.length > 0) {
            const annees = [...new Set(data.map((item) => item.exercice))].sort((a, b) => b - a);
            setAnneesDisponibles(annees);
        } else {
            setAnneesDisponibles([]);
        }
    }, [data]);

    const getFilteredData = () => {
        let filtered = [...data];
        if (filterAnnee) {
            filtered = filtered.filter((item) => item.exercice === parseInt(filterAnnee, 10));
        }
        if (filterMethode) {
            filtered = filtered.filter((item) => item.methode === filterMethode);
        }
        return filtered;
    };

    const filteredData = getFilteredData();

    if (loading) {
        return <LoadingSpinner message={t('amortissements.list.loading')} />;
    }

    return (
        <div className="app-page">
            {canCloture && !bienId && (
                <div className="flex justify-end mb-4 w-full sm:w-auto">
                    <button
                        type="button"
                        className="btn-primary w-full sm:w-auto min-h-[44px] py-2.5 flex items-center justify-center"
                        onClick={() => setShowCloture(true)}
                        aria-label={t('amortissements.list.closeExerciceAria')}
                    >
                        {t('amortissements.list.closeExercice', { year: new Date().getFullYear() })}
                    </button>
                </div>
            )}

            <ClotureExercice
                isOpen={showCloture}
                onClose={() => setShowCloture(false)}
                onSuccess={() => refresh()}
            />

            {error && (
                <div className="alert-error mb-4">{error}</div>
            )}

            {statistiques && !bienId && (
                <div className="app-stats-grid">
                    <div className="app-card app-card-body-compact text-center">
                        <div className="text-lg font-bold text-primary-500">{formatPrice(statistiques.total_amortissements_comptables)}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('amortissements.list.statComptable')}</div>
                    </div>
                    <div className="app-card app-card-body-compact text-center">
                        <div className="text-lg font-bold text-primary-600">{formatPrice(statistiques.total_amortissements_fiscaux)}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('amortissements.list.statFiscal')}</div>
                    </div>
                    <div className="app-card app-card-body-compact text-center">
                        <div className="text-lg font-bold text-danger">{formatPrice(statistiques.total_ecarts_a_reintegrer)}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('amortissements.list.statEcart')}</div>
                    </div>
                    <div className="app-card app-card-body-compact text-center">
                        <div className="text-lg font-bold text-success">{formatPrice(statistiques.economie_impot_annuelle)}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">{t('amortissements.list.statEconomie')}</div>
                    </div>
                </div>
            )}

            <div className="app-card overflow-hidden">
                <div className="app-card-header flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{t('amortissements.list.title')}</h3>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {anneesDisponibles.length > 0 && (
                            <select
                                value={filterAnnee}
                                onChange={(e) => setFilterAnnee(e.target.value)}
                                className="form-input min-h-[44px]"
                            >
                                <option value="">{t('amortissements.list.allYears')}</option>
                                {anneesDisponibles.map((annee) => (
                                    <option key={annee} value={annee}>{annee}</option>
                                ))}
                            </select>
                        )}
                        <select
                            value={filterMethode}
                            onChange={(e) => setFilterMethode(e.target.value)}
                            className="form-input min-h-[44px]"
                        >
                            <option value="">{t('amortissements.list.allMethods')}</option>
                            {Object.entries(getMethodeLabels(t)).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="app-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {!bienId && <th>{t('amortissements.list.colBien')}</th>}
                                {!bienId && <th>{t('amortissements.list.colQrCode')}</th>}
                                <th>{t('amortissements.list.colExercice')}</th>
                                <th>{t('amortissements.list.colMethode')}</th>
                                <th className="text-right">{t('amortissements.list.colAmortComptable')}</th>
                                <th className="text-right">{t('amortissements.list.colAmortFiscal')}</th>
                                <th className="text-right">{t('amortissements.list.colEcart')}</th>
                                <th className="text-right">{t('amortissements.list.colVnc')}</th>
                                <th className="text-center">{t('common.status')}</th>
                                <th className="text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={bienId ? 8 : 10} className="text-center py-8 text-gray-400 dark:text-slate-500">
                                        {t('amortissements.list.empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id_amortissement} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        {!bienId && (
                                            <td className="text-sm">
                                                <div className="font-medium">{item.bien_designation || `Bien #${item.id_bien}`}</div>
                                                {item.type_bien && (
                                                    <div className="text-xs text-gray-500 capitalize">{item.type_bien}</div>
                                                )}
                                            </td>
                                        )}
                                        {!bienId && (
                                            <td className="text-sm font-mono text-gray-600">{item.qr_code || '—'}</td>
                                        )}
                                        <td className="text-sm">{item.exercice}</td>
                                        <td className="text-sm text-gray-600 dark:text-slate-300">
                                            {getMethodeLabels(t)[item.methode] || item.methode}
                                        </td>
                                        <td className="text-sm text-right font-medium text-green-600">{formatPrice(item.annuite_comptable)}</td>
                                        <td className="text-sm text-right text-gray-600 dark:text-slate-300">{formatPrice(item.annuite_fiscale)}</td>
                                        <td className="text-sm text-right font-medium text-red-600">{formatPrice(item.ecart_a_reintegrer)}</td>
                                        <td className="text-sm text-right">{formatPrice(item.valeur_nette_comptable)}</td>
                                        <td className="text-center">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                                                {item.statut}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/amortissements/fiche/${item.id_bien}`)}
                                                className="text-primary-600 hover:text-primary-700 text-sm"
                                            >
                                                {t('amortissements.list.viewPlan')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ListeAmortissements;
