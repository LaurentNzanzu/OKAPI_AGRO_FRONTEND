// frontend/src/components/amortissements/EcrituresComptables.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { ecrituresService } from '../../services/ecritures_comptables';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  AppIcon,
  StatusBadge,
  CheckCircleIcon,
  PencilSquareIcon,
  ClockIcon,
  XMarkIcon,
  CalculatorIcon,
  DocumentTextIcon,
} from '../ui/icons';

const formatApiError = (err, t) => {
    if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
            return err.response.data.detail
                .map(d => {
                    const field = d.loc?.filter(l => l !== 'body').join('.') || t('amortissementsEcritures.field');
                    return `${field}: ${d.msg}`;
                })
                .join(', ');
        }
        if (typeof err.response.data.detail === 'string') {
            return err.response.data.detail;
        }
    }
    return err.message || t('amortissementsEcritures.genericError');
};

const EcrituresComptables = ({ bienId }) => {
    const { t } = useTranslation();
    const [ecritures, setEcritures] = useState([]);
    const [filterStatut, setFilterStatut] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedEcriture, setSelectedEcriture] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [ajustementMontant, setAjustementMontant] = useState('');
    const [motifAjustement, setMotifAjustement] = useState('');
    const [detailsCalcul, setDetailsCalcul] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [filters, setFilters] = useState({
        type_operation: '',
        date_debut: '',
        date_fin: '',
        statut: ''
    });

    const fetchEcritures = async () => {
        try {
            setLoading(true);
            let data;
            
            // Construire les paramètres de filtrage
            const params = {};
            if (filters.type_operation) params.type_operation = filters.type_operation;
            if (filters.date_debut) params.date_debut = filters.date_debut;
            if (filters.date_fin) params.date_fin = filters.date_fin;
            if (filters.statut) params.statut = filters.statut;
            params.limit = 500;
            
            if (bienId) {
                const allData = await ecrituresService.getAll(params);
                data = allData.filter(e => e.id_bien === parseInt(bienId));
            } else {
                data = await ecrituresService.getAll(params);
            }
            setEcritures(data || []);
        } catch (err) {
            console.error('Erreur chargement écritures:', err);
            if (err.response?.status === 500) {
                setError(t('amortissementsEcritures.serverError'));
            } else if (err.code === 'ERR_NETWORK') {
                setError(t('amortissementsEcritures.networkError'));
            } else {
                setError(t('amortissementsEcritures.loadError'));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEcritures();
    }, [bienId, filters]);

    const handleValider = async (id) => {
        try {
            await ecrituresService.valider(id);
            setSuccess(t('amortissementsEcritures.validateSuccess'));
            fetchEcritures();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur validation:', err);
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleModifierMontant = async (id) => {
        if (!ajustementMontant || parseFloat(ajustementMontant) <= 0) {
            setError(t('amortissementsEcritures.invalidAmount'));
            setTimeout(() => setError(null), 3000);
            return;
        }
        if (!motifAjustement.trim()) {
            setError(t('amortissementsEcritures.motifRequired'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        try {
            await ecrituresService.modifierMontant(id, parseFloat(ajustementMontant), motifAjustement);
            setSuccess(t('amortissementsEcritures.adjustSuccess'));
            setShowModal(false);
            setSelectedEcriture(null);
            setAjustementMontant('');
            setMotifAjustement('');
            fetchEcritures();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur ajustement:', err);
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleVoirDetails = (ecriture) => {
        setSelectedEcriture(ecriture);
        setAjustementMontant(ecriture.montant.toString());
        
        let details = '';
        
        if (ecriture.montant_original && ecriture.montant_original !== ecriture.montant) {
            details += `${t('amortissementsEcritures.originalAmount', { value: formatPrice(ecriture.montant_original) })}\n`;
            details += `${t('amortissementsEcritures.adjustedAmount', { value: formatPrice(ecriture.montant) })}\n`;
            if (ecriture.motif_modification) {
                details += `${t('amortissementsEcritures.adjustMotif', { motif: ecriture.motif_modification })}\n`;
            }
            if (ecriture.date_modification) {
                details += `${t('amortissementsEcritures.modifyDate', { date: formatDate(ecriture.date_modification) })}\n`;
            }
        } else {
            details += `${t('amortissementsEcritures.amount', { value: formatPrice(ecriture.montant) })}\n`;
            details += `${t('amortissementsEcritures.amountUnmodified')}\n`;
        }
        
        if (ecriture.details_calcul) {
            try {
                if (typeof ecriture.details_calcul === 'object') {
                    details += `\n${t('amortissementsEcritures.calcDetails')}:\n`;
                    details += `   • ${t('amortissementsEcritures.calcBase', { value: formatPrice(ecriture.details_calcul.base || 0) })}\n`;
                    details += `   • ${t('amortissementsEcritures.calcTaux', { taux: ecriture.details_calcul.taux || 0 })}\n`;
                    details += `   • ${t('amortissementsEcritures.calcMethode', { methode: ecriture.details_calcul.methode || '-' })}\n`;
                    if (ecriture.details_calcul.prorata_jours) {
                        details += `   • ${t('amortissementsEcritures.calcProrataJours', { jours: ecriture.details_calcul.prorata_jours })}\n`;
                    }
                    if (ecriture.details_calcul.prorata_mois) {
                        details += `   • ${t('amortissementsEcritures.calcProrataMois', { mois: ecriture.details_calcul.prorata_mois })}\n`;
                    }
                    if (ecriture.details_calcul.coefficient) {
                        details += `   • ${t('amortissementsEcritures.calcCoeff', { coeff: ecriture.details_calcul.coefficient })}\n`;
                    }
                } else if (typeof ecriture.details_calcul === 'string' && ecriture.details_calcul.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(ecriture.details_calcul);
                        details += `\n${t('amortissementsEcritures.calcDetails')}:\n`;
                        details += `   • ${t('amortissementsEcritures.calcBaseShort', { value: formatPrice(parsed.base || 0) })}\n`;
                        details += `   • ${t('amortissementsEcritures.calcTaux', { taux: parsed.taux || 0 })}\n`;
                        details += `   • ${t('amortissementsEcritures.calcMethode', { methode: parsed.methode || '-' })}\n`;
                        if (parsed.prorata_jours) {
                            details += `   • ${t('amortissementsEcritures.calcProrataJours', { jours: parsed.prorata_jours })}\n`;
                        }
                    } catch {
                        details += `\n${t('amortissementsEcritures.calcDetails')}: ${ecriture.details_calcul}\n`;
                    }
                } else {
                    details += `\n${t('amortissementsEcritures.calcDetails')}: ${ecriture.details_calcul}\n`;
                }
            } catch (err) {
                details += `\n${t('amortissementsEcritures.calcDetails')}: ${ecriture.details_calcul}\n`;
            }
        }
        
        setDetailsCalcul(details);
        setShowModal(true);
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (filters.type_operation) params.set('type_operation', filters.type_operation);
            if (filters.date_debut) params.set('date_debut', filters.date_debut);
            if (filters.date_fin) params.set('date_fin', filters.date_fin);
            if (filters.statut) params.set('statut', filters.statut);
            
            // Utiliser window.open pour télécharger le CSV
            window.open(`/api/v1/ecritures/export-csv?${params.toString()}`, '_blank');
            setSuccess(t('amortissementsEcritures.exportSuccess'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur export:', err);
            setError(t('amortissementsEcritures.exportError'));
            setTimeout(() => setError(null), 5000);
        } finally {
            setExporting(false);
        }
    };

    const getStatutBadge = (statut, validee) => {
        if (validee) {
            return <StatusBadge label={t('amortissementsEcritures.statutValidated')} Icon={CheckCircleIcon} color="bg-green-100 text-green-700" />;
        }
        if (statut === 'MODIFIEE') {
            return <StatusBadge label={t('amortissementsEcritures.statutModified')} Icon={PencilSquareIcon} color="bg-orange-100 text-orange-700" />;
        }
        return <StatusBadge label={t('amortissementsEcritures.statutDraft')} Icon={ClockIcon} color="bg-yellow-100 text-yellow-700" />;
    };

    const getFilteredEcritures = () => {
        if (filterStatut === 'all') return ecritures;
        if (filterStatut === 'validees') return ecritures.filter(e => e.validee);
        if (filterStatut === 'non_validees') return ecritures.filter(e => !e.validee);
        if (filterStatut === 'modifiees') return ecritures.filter(e => e.statut === 'MODIFIEE');
        return ecritures;
    };

    const filteredEcritures = getFilteredEcritures();

    if (loading) {
        return <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div><p className="mt-2 text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.loading')}</p></div>;
    }

    return (
        <div className="app-page">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 border border-red-200">
                    <p className="text-sm font-medium">{t('amortissementsEcritures.errorTitle')}</p>
                    <p className="text-xs">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 border border-green-200">
                    {success}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold mb-3">
                        {bienId ? t('amortissementsEcritures.titleBien') : t('amortissementsEcritures.title')}
                    </h3>
                    
                    {/* Barre de filtres */}
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[140px]">
                            <label className="form-label text-xs">{t('amortissementsEcritures.filterType')}</label>
                            <select
                                className="form-input text-sm"
                                value={filters.type_operation}
                                onChange={(e) => setFilters({...filters, type_operation: e.target.value})}
                            >
                                <option value="">{t('amortissementsEcritures.allTypes')}</option>
                                <option value="DOTATION_AMORTISSEMENT">Dotation amortissement</option>
                                <option value="ACQUISITION">Acquisition</option>
                                <option value="CESSION">Cession</option>
                                <option value="DEPRECIATION">Dépréciation</option>
                                <option value="REPRISE_DEPRECIATION">Reprise dépréciation</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="form-label text-xs">{t('amortissementsEcritures.filterDateDebut')}</label>
                            <input
                                type="date"
                                className="form-input text-sm"
                                value={filters.date_debut}
                                onChange={(e) => setFilters({...filters, date_debut: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="form-label text-xs">{t('amortissementsEcritures.filterDateFin')}</label>
                            <input
                                type="date"
                                className="form-input text-sm"
                                value={filters.date_fin}
                                onChange={(e) => setFilters({...filters, date_fin: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                            <label className="form-label text-xs">{t('amortissementsEcritures.filterStatut')}</label>
                            <select
                                className="form-input text-sm"
                                value={filters.statut}
                                onChange={(e) => setFilters({...filters, statut: e.target.value})}
                            >
                                <option value="">{t('amortissementsEcritures.allStatuts')}</option>
                                <option value="BROUILLON">Brouillon</option>
                                <option value="VALIDEE">Validée</option>
                                <option value="MODIFIEE">Modifiée</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn-secondary text-sm px-3 py-2"
                                onClick={() => setFilters({type_operation: '', date_debut: '', date_fin: '', statut: ''})}
                            >
                                {t('amortissementsEcritures.clearFilters')}
                            </button>
                            <button
                                className="btn-primary flex items-center gap-2 text-sm px-3 py-2"
                                onClick={handleExportCSV}
                                disabled={exporting}
                            >
                                <AppIcon icon={DocumentTextIcon} size="sm" className="text-white" />
                                {exporting ? t('common.loading') : t('amortissementsEcritures.exportCSV')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colDate')}</th>
                                {!bienId && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colAsset')}</th>}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colLibelle')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colType')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colComptes')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colMontant')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colMontantOriginal')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colStatut')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEcritures.length === 0 ? (
                                <tr>
                                    <td colSpan={bienId ? 8 : 9} className="text-center py-8 text-gray-400 dark:text-slate-500">
                                        {t('amortissementsEcritures.empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredEcritures.map((e) => (
                                    <tr key={e.id_ecriture} className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                                        <td className="px-4 py-3 text-sm">{formatDate(e.date_ecriture)}</td>
                                        {!bienId && (
                                            <td className="px-4 py-3 text-sm">
                                                {e.bien_designation || `Bien #${e.id_bien}`}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-sm">{e.libelle || '-'}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-slate-400">{e.type_operation}</td>
                                        <td className="px-4 py-3 text-sm font-mono">{e.compte_debit} / {e.compte_credit}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-primary-600">
                                            {formatPrice(e.montant)}
                                            {e.montant !== e.montant_original && (
                                                <span className="text-xs text-orange-500 ml-1">{t('amortissementsEcritures.adjusted')}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-400 dark:text-slate-500">
                                            {e.montant_original ? formatPrice(e.montant_original) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatutBadge(e.statut, e.validee)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleVoirDetails(e)}
                                                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                                                >
                                                    {t('amortissementsEcritures.details')}
                                                </button>
                                                {!e.validee && (
                                                    <button
                                                        onClick={() => handleValider(e.id_ecriture)}
                                                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                                    >
                                                        {t('amortissementsEcritures.validate')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && selectedEcriture && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">{t('amortissementsEcritures.modalTitle')}</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-300">
                                    <AppIcon icon={XMarkIcon} size="md" />
                                </button>
                            </div>

                            <div className="app-page">
                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.modalId')}</p>
                                        <p className="font-medium">{selectedEcriture.id_ecriture}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.modalDate')}</p>
                                        <p className="font-medium">{formatDate(selectedEcriture.date_ecriture)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.modalType')}</p>
                                        <p className="font-medium">{selectedEcriture.type_operation}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{t('amortissementsEcritures.modalComptes')}</p>
                                        <p className="font-mono">{selectedEcriture.compte_debit} / {selectedEcriture.compte_credit}</p>
                                    </div>
                                </div>

                                {detailsCalcul && (
                                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                        <p className="text-sm font-bold text-primary-600 mb-2 flex items-center gap-2">
                                            <AppIcon icon={CalculatorIcon} size="sm" />
                                            {t('amortissementsEcritures.calcDetails')}
                                        </p>
                                        <pre className="text-xs text-primary-600 whitespace-pre-wrap font-mono">{detailsCalcul}</pre>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissementsEcritures.amountLabel')}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={ajustementMontant}
                                        onChange={(e) => setAjustementMontant(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                        disabled={selectedEcriture.validee}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissementsEcritures.motifLabel')}</label>
                                    <textarea
                                        value={motifAjustement}
                                        onChange={(e) => setMotifAjustement(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                        rows="2"
                                        placeholder={t('amortissementsEcritures.motifPlaceholder')}
                                        disabled={selectedEcriture.validee}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    {!selectedEcriture.validee && (
                                        <>
                                            <button
                                                onClick={() => handleModifierMontant(selectedEcriture.id_ecriture)}
                                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                            >
                                                {t('amortissementsEcritures.adjustAmount')}
                                            </button>
                                            <button
                                                onClick={() => handleValider(selectedEcriture.id_ecriture)}
                                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                            >
                                                {t('amortissementsEcritures.validateDirect')}
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-400"
                                    >
                                        {t('amortissementsEcritures.close')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EcrituresComptables;