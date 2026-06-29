// frontend/src/components/amortissements/FicheAmortissement.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useParams, useNavigate } from 'react-router-dom';
import { amortissementsService } from '../../services/amortissements';
import { biensService } from '../../services/biens';
import { ecrituresService } from '../../services/ecritures_comptables';
import { formatPrice, formatDate } from '../../utils/formatters';
import etatsService from '../../services/etats';
import WorkflowAmortissementStepper from './WorkflowAmortissementStepper';
import {
  AppIcon,
  EyeIcon,
  PrinterIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  PlayIcon,
  XCircleIcon,
  StatusBadge,
} from '../ui/icons';

const FicheAmortissement = () => {
  const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [bien, setBien] = useState(null);
    const [amortissement, setAmortissement] = useState(null);
    const [plan, setPlan] = useState([]);
    const [ecritures, setEcritures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [printing, setPrinting] = useState(false);
    
    // État pour la dépréciation
    const [showDepreciationModal, setShowDepreciationModal] = useState(false);
    const [nouvelleValeur, setNouvelleValeur] = useState('');
    const [motifDepreciation, setMotifDepreciation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [bienResult, planResult, ecrituresResult, amortResult] = await Promise.allSettled([
                biensService.getById(id),
                amortissementsService.getPlan(id),
                ecrituresService.getByBien(id, { limit: 100 }),
                amortissementsService.getByBien(id),
            ]);

            if (bienResult.status === 'rejected') {
                throw bienResult.reason;
            }
            setBien(bienResult.value);
            setPlan(planResult.status === 'fulfilled' ? planResult.value : []);

            if (ecrituresResult.status === 'fulfilled') {
                setEcritures(Array.isArray(ecrituresResult.value) ? ecrituresResult.value : []);
            } else {
                console.warn('Écritures non chargées:', ecrituresResult.reason);
                setEcritures([]);
            }

            if (amortResult.status === 'fulfilled' && amortResult.value?.length > 0) {
                setAmortissement(amortResult.value[0]);
            } else {
                setAmortissement(null);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
            setError(err.response?.data?.detail || t('amortissements.fiche.loadError'));
        } finally {
            setLoading(false);
        }
    };

    // Impression PDF de la fiche d'amortissement
    const handlePrintFiche = async () => {
        try {
            setPrinting(true);
            await etatsService.exportFicheAmortissement(parseInt(id));
        } catch (err) {
            console.error('Erreur lors de l\'impression:', err);
            setError(err.message || t('amortissements.fiche.printError'));
            setTimeout(() => setError(null), 3000);
        } finally {
            setPrinting(false);
        }
    };

    const handleApercuFiche = () => {
        window.open(`/prints/fiche-amortissement/${id}`, '_blank', 'noopener,noreferrer');
    };

    const handleAppliquerDepreciation = async () => {
        if (!nouvelleValeur || parseFloat(nouvelleValeur) <= 0) {
            setError(t('amortissements.fiche.invalidValue'));
            return;
        }
        
        if (!motifDepreciation.trim()) {
            setError(t('amortissements.fiche.motifRequired'));
            return;
        }
        
        setSubmitting(true);
        try {
            // Appel API pour appliquer la dépréciation
            await amortissementsService.appliquerDepreciation(id, {
                nouvelle_valeur: parseFloat(nouvelleValeur),
                motif: motifDepreciation,
                date_depreciation: new Date().toISOString()
            });
            
            setSuccess(t('amortissements.fiche.depreciationSuccess'));
            setShowDepreciationModal(false);
            setNouvelleValeur('');
            setMotifDepreciation('');
            fetchData(); // Recharger les données
            
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur dépréciation:', err);
            setError(err.response?.data?.detail || t('amortissements.fiche.depreciationError'));
            setTimeout(() => setError(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatutBadge = (statut) => {
        const badges = {
            'EN_COURS': <StatusBadge label={t('amortissements.fiche.statutEnCours')} Icon={PlayIcon} color="bg-green-100 text-green-700" />,
            'TERMINE': <StatusBadge label={t('amortissements.fiche.statutTermine')} Icon={CheckCircleIcon} color="bg-gray-100 text-gray-700" />,
            'SUSPENDU': <StatusBadge label={t('amortissements.fiche.statutSuspendu')} Icon={XCircleIcon} color="bg-red-100 text-red-700" />,
        };
        return badges[statut] || <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{statut}</span>;
    };

    const getVNCProjetee = () => {
        if (plan.length === 0) return 0;
        const anneeEnCours = new Date().getFullYear();
        const ligneAnneeEnCours = plan.find(row => row.annee === anneeEnCours);
        return ligneAnneeEnCours?.vnc_fin_c || plan[plan.length - 1]?.vnc_fin_c || 0;
    };

    const getTauxProgression = () => {
        if (!amortissement) return 0;
        const total = amortissement.valeur_origine;
        const amorti = amortissement.cumul_comptable;
        return (amorti / total) * 100;
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-slate-400">{t('amortissements.fiche.loading')}</p>
            </div>
        );
    }

    if (!bien) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-8 text-center">
                <p className="text-red-500">{t('amortissements.fiche.bienNotFound')}</p>
                <button onClick={() => navigate('/biens')} className="mt-4 text-primary-500">{t('amortissements.fiche.backToList')}</button>
            </div>
        );
    }

    return (
        <div className="app-page">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg border border-green-200">
                    {success}
                </div>
            )}

            {/* En-tête avec informations bien */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {bien.marque || bien.fabricant} {bien.modele || ''}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                            {t('amortissements.fiche.categorie')} <span className="capitalize">{bien.type_bien}</span> | 
                            {t('common.idPrefix')} #{bien.id_bien}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/biens/${id}`)}
                            className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                        >
                            {t('amortissements.fiche.viewBien')}
                        </button>
                        <button
                            onClick={handleApercuFiche}
                            className="px-3 py-1 border border-green-700 text-green-800 rounded-lg hover:bg-green-50 text-sm flex items-center gap-1"
                        >
                          <AppIcon icon={EyeIcon} size="sm" />
                          {t('amortissements.fiche.preview')}
                        </button>
                        <button
                            onClick={handlePrintFiche}
                            disabled={printing}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                            {printing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>{t('amortissements.fiche.generating')}</span>
                                </>
                            ) : (
                                <>
                                    <AppIcon icon={PrinterIcon} size="sm" className="text-white" />
                                    PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowDepreciationModal(true)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm inline-flex items-center gap-1"
                            disabled={!amortissement}
                        >
                            <AppIcon icon={ArrowTrendingDownIcon} size="sm" className="text-white" />
                            {t('amortissements.fiche.applyDepreciation')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Workflow de Validation en 4 étapes (COMPTABLE -> CAISSE -> DG -> COMPTABLE) */}
            {amortissement && (
                <WorkflowAmortissementStepper 
                    idAmortissement={amortissement.id_amortissement} 
                    onWorkflowUpdate={fetchData} 
                />
            )}

            {/* Cartes de synthèse */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('amortissements.fiche.valeurOrigine')}</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-slate-100">{formatPrice(bien.prix_acquisition)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('amortissements.fiche.vncActuelle')}</p>
                    <p className="text-xl font-bold text-primary-600">
                        {formatPrice(amortissement?.valeur_nette_comptable || getVNCProjetee())}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('amortissements.fiche.cumulAmorti')}</p>
                    <p className="text-xl font-bold text-green-600">{formatPrice(amortissement?.cumul_comptable || 0)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('amortissements.fiche.progression')}</p>
                    <p className="text-xl font-bold text-primary-600">{getTauxProgression().toFixed(1)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(getTauxProgression(), 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Informations amortissement */}
            {amortissement && (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <AppIcon icon={ChartBarIcon} size="md" />
                        {t('amortissements.fiche.situationActuelle')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.methode')}</p>
                            <p className="font-medium">{amortissement.methode}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.exerciceEnCours')}</p>
                            <p className="font-medium">{amortissement.exercice}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.tauxComptable')}</p>
                            <p className="font-medium">{amortissement.taux_comptable}%</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('common.status')}</p>
                            <p>{getStatutBadge(amortissement.statut)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.dateDebut')}</p>
                            <p className="font-medium">{formatDate(amortissement.date_debut)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.dureeComptable')}</p>
                            <p className="font-medium">{t('common.years', { count: amortissement.duree_vie_comptable_ans })}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.dureeFiscale')}</p>
                            <p className="font-medium">{t('common.years', { count: amortissement.duree_vie_fiscale_ans })}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-slate-400">{t('amortissements.fiche.ecartReintegrer')}</p>
                            <p className="font-medium text-red-600">{formatPrice(amortissement.ecart_a_reintegrer)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Plan d'amortissement */}
            {plan.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <AppIcon icon={CalendarDaysIcon} size="md" />
                            {t('amortissements.fiche.planTitle')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colAnnee')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colVncDebut')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colAnnuite')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colEcartFiscal')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colCumul')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colVncFin')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {plan.slice(0, 8).map((row, idx) => (
                                    <tr key={idx} className={row.annee === new Date().getFullYear() ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}>
                                        <td className="px-4 py-3 text-sm font-medium">{row.annee}</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatPrice(row.vnc_debut_c)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatPrice(row.annuite_c)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-red-600">{formatPrice(row.ecart)}</td>
                                        <td className="px-4 py-3 text-sm text-right">{formatPrice(row.cumul_c)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(row.vnc_fin_c)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {plan.length > 8 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan="6" className="px-4 py-3 text-center text-gray-400 dark:text-slate-500 text-sm">
                                            {t('amortissements.fiche.moreYears', { count: plan.length - 8 })}
                                            <button 
                                                onClick={() => navigate(`/amortissements/tableau/${id}`)}
                                                className="ml-2 text-primary-500 hover:underline"
                                            >
                                                {t('amortissements.fiche.viewFullPlan')}
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* Écritures comptables */}
            {ecritures.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <AppIcon icon={DocumentTextIcon} size="md" />
                            {t('amortissements.fiche.ecrituresTitle')}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colDate')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colType')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colComptes')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.fiche.colMontant')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('common.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ecritures.slice(0, 5).map((e) => (
                                    <tr key={e.id_ecriture} className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                                        <td className="px-4 py-3 text-sm">{formatDate(e.date_ecriture)}</td>
                                        <td className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-slate-400">{e.type_operation}</td>
                                        <td className="px-4 py-3 text-sm font-mono">{e.compte_debit} / {e.compte_credit}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(e.montant)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {e.validee ? 
                                                <StatusBadge label={t('amortissements.fiche.validee')} Icon={CheckCircleIcon} color="bg-green-100 text-green-700" /> :
                                                <StatusBadge label={t('amortissements.fiche.enAttente')} Icon={ClockIcon} color="bg-yellow-100 text-yellow-700" />
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Dépréciation */}
            {showDepreciationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <AppIcon icon={ArrowTrendingDownIcon} size="md" />
                                    {t('amortissements.fiche.depreciationModalTitle')}
                                </h3>
                                <button onClick={() => setShowDepreciationModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-300">
                                    <AppIcon icon={XMarkIcon} size="md" />
                                </button>
                            </div>

                            <div className="app-page">
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        {t('amortissements.fiche.depreciationInfo')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        {t('amortissements.fiche.valeurActuelle', { value: formatPrice(amortissement?.valeur_nette_comptable || 0) })}
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        {t('amortissements.fiche.nouvelleValeur')}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={nouvelleValeur}
                                        onChange={(e) => setNouvelleValeur(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                        placeholder="Ex: 5000000"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissements.fiche.motifDepreciation')}</label>
                                    <textarea
                                        value={motifDepreciation}
                                        onChange={(e) => setMotifDepreciation(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                        rows="3"
                                        placeholder={t('amortissements.fiche.motifPlaceholder')}
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={handleAppliquerDepreciation}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                    >
                                        {submitting ? t('common.processing') : t('amortissements.fiche.applyDepreciationBtn')}
                                    </button>
                                    <button
                                        onClick={() => setShowDepreciationModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-400"
                                    >
                                        {t('common.cancel')}
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

export default FicheAmortissement;