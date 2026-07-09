// frontend/src/components/validations/FicheValidation.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useParams, useNavigate } from 'react-router-dom';
import { validationsService } from '../../services/validations';
import { formatPrice, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { StatutBesoin } from '../../utils/workflowEnums';
import WorkflowValidation from './WorkflowValidation';
import {
    AppIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    PencilSquareIcon,
} from '../ui/icons';

const FicheValidation = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const besoinId = parseInt(id, 10);
    
    const [workflow, setWorkflow] = useState(null);
    const [historique, setHistorique] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [decision, setDecision] = useState('APPROUVE');
    const [commentaire, setCommentaire] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [stockChecking, setStockChecking] = useState(false);
    const [stockWarning, setStockWarning] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [workflowData, historiqueData] = await Promise.all([
                validationsService.getWorkflow(id),
                validationsService.getHistorique(id)
            ]);
            setWorkflow(workflowData);
            setHistorique(historiqueData);
        } catch (err) {
            setError('Impossible de charger les détails');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const isCaisseStep = workflow?.statut_actuel === 'COMPTABLE_VALIDE' && decision === 'APPROUVE';
            if (isCaisseStep) {
                setStockChecking(true);
            }
            const result = await validationsService.valider(id, decision, commentaire);
            setShowModal(false);
            setStockChecking(false);
            if (result?.statut === StatutBesoin.ATTENTE_STOCK) {
                alert('Besoin approuvé mais stock insuffisant pour certaines pièces. Le magasinier et le responsable de stock ont été notifiés.');
            } else if (isCaisseStep && decision === 'APPROUVE') {
                alert('Besoin approuvé avec succès.');
            }
            fetchData();
        } catch (err) {
            setStockChecking(false);
            alert(err.response?.data?.detail || 'Erreur lors de la validation');
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ Message indiquant qui doit valider ensuite
    const getNextValidatorLabel = () => {
        if (!workflow) return '';
        const status = workflow.statut_actuel;
        
        // Ordre du workflow: COMPTABLE → CAISSE → DG
        if (status === 'BROUILLON' || status === 'EN_VALIDATION') {
            return 'le Comptable';
        }
        if (status === 'COMPTABLE_VALIDE') {
            return 'la Caisse';
        }
        if (status === 'CAISSE_VALIDE') {
            return 'le Directeur Général (DG)';
        }
        if (status === 'APPROUVEE') {
            return '✅ Validation terminée';
        }
        if (status === 'REJETE') {
            return '❌ Demande rejetée';
        }
        
        // Fallback: essayer de déterminer à partir des validations
        const validations = workflow.validations_realisees || [];
        const ordresValides = validations.map(v => v.ordre);
        
        if (!ordresValides.includes('COMPTABLE')) {
            return 'le Comptable';
        }
        if (!ordresValides.includes('CAISSE')) {
            return 'la Caisse';
        }
        if (!ordresValides.includes('DG')) {
            return 'le Directeur Général (DG)';
        }
        
        return 'le prochain validateur';
    };

    // ✅ Vérifier si l'utilisateur actuel est celui qui doit valider
    const isCurrentValidator = () => {
        if (!workflow || !user || !user.roles) return false;
        
        const currentRole = user.roles.find(r => ['DG', 'COMPTABLE', 'CAISSE', 'ADMIN'].includes(r));
        const status = workflow.statut_actuel;

        if (currentRole === 'ADMIN') return true;
        
        // Ordre du workflow: COMPTABLE → CAISSE → DG
        if (status === 'BROUILLON' || status === 'EN_VALIDATION') {
            return currentRole === 'COMPTABLE';
        }
        if (status === 'COMPTABLE_VALIDE') {
            return currentRole === 'CAISSE';
        }
        if (status === 'CAISSE_VALIDE') {
            return currentRole === 'DG';
        }
        
        return false;
    };

    // ✅ Fonction pour rafraîchir les données
    const handleRefresh = () => {
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!workflow) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 dark:text-slate-400">Besoin non trouvé</p>
                <button onClick={() => navigate('/validations')} className="mt-4 text-primary-500 inline-flex items-center gap-1.5">
                    <AppIcon icon={ArrowLeftIcon} size="sm" />
                    Retour
                </button>
            </div>
        );
    }

    return (
        <div className="app-page">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/validations')} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 p-1" aria-label="Retour">
                    <AppIcon icon={ArrowLeftIcon} size="md" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Détails de la validation</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Demande {workflow.numero_demande}</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Résumé */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Montant total</p>
                        <p className="text-2xl font-bold text-primary-600">
                            {formatPrice(workflow.montant_total)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Statut actuel</p>
                        <p className="text-lg font-semibold">{workflow.statut_actuel}</p>
                    </div>
                </div>

                <WorkflowValidation 
                    workflow={workflow} 
                    besoinId={besoinId}
                    onRefresh={handleRefresh}
                />
            </div>

            {/* ✅ BOUTON D'ACTION CONDITIONNEL */}
            {!loading && workflow.statut_actuel !== 'APPROUVEE' && workflow.statut_actuel !== 'REJETE' && (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                    <h3 className="font-semibold mb-4">Actions</h3>
                    
                    {isCurrentValidator() ? (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium inline-flex items-center gap-2"
                        >
                            <AppIcon icon={PencilSquareIcon} size="sm" className="text-white" />
                            Donner mon avis (Valider)
                        </button>
                    ) : (
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border text-center text-gray-600 dark:text-slate-300">
                            <p className="inline-flex items-center justify-center gap-1.5">
                                <AppIcon icon={ClockIcon} size="sm" />
                                Vous n'êtes pas l'attendu(e) pour cette étape.
                            </p>
                            <p className="text-sm mt-1">
                                La prochaine validation doit être effectuée par <strong>{getNextValidatorLabel()}</strong>.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de validation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="modal-panel p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Valider la demande</h3>
                        
                        <div className="app-page">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    Décision
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDecision('APPROUVE')}
                                        className={`flex-1 px-4 py-2 rounded-lg border inline-flex items-center justify-center gap-1.5 ${
                                            decision === 'APPROUVE'
                                                ? 'bg-green-500 text-white border-green-500'
                                                : 'border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <AppIcon icon={CheckCircleIcon} size="sm" className={decision === 'APPROUVE' ? 'text-white' : ''} />
                                        Approuver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDecision('REJETE')}
                                        className={`flex-1 px-4 py-2 rounded-lg border inline-flex items-center justify-center gap-1.5 ${
                                            decision === 'REJETE'
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <AppIcon icon={XCircleIcon} size="sm" className={decision === 'REJETE' ? 'text-white' : ''} />
                                        Rejeter
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    Commentaire (optionnel)
                                </label>
                                <textarea
                                    value={commentaire}
                                    onChange={(e) => setCommentaire(e.target.value)}
                                    rows={3}
                                    className="form-input"
                                    placeholder="Ajouter un commentaire..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                {stockChecking && (
                                    <p className="text-sm text-gray-500 mr-auto">Vérification stock : en cours...</p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Enregistrement...' : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FicheValidation;