// frontend/src/components/amortissements/WorkflowAmortissement.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  CheckIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Card from '../ui/Card';

export const WorkflowAmortissement = ({ idAmortissement, currentRole, onWorkflowUpdated }) => {
    const { t } = useTranslation();
    const [workflow, setWorkflow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Forms state
    const [caisseCommentaire, setCaisseCommentaire] = useState('');
    const [dgCommentaire, setDgCommentaire] = useState('');
    const [comptableCommentaire, setComptableCommentaire] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchWorkflow = async () => {
        try {
            setLoading(true);
            const data = await amortissementsService.getWorkflowStatus(idAmortissement);
            setWorkflow(data);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement workflow:', err);
            setError('Impossible de charger le statut du workflow de validation.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (idAmortissement) {
            fetchWorkflow();
        }
    }, [idAmortissement]);

    const handleCaisseAction = async (disponible) => {
        try {
            setActionLoading(true);
            setError(null);
            await amortissementsService.verifierTresorerie(idAmortissement, {
                tresorerie_disponible: disponible,
                commentaire: caisseCommentaire
            });
            setCaisseCommentaire('');
            await fetchWorkflow();
            if (onWorkflowUpdated) onWorkflowUpdated();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Erreur lors de la vérification.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDGAction = async (approuve) => {
        if (!approuve && !dgCommentaire.trim()) {
            setError(t('caisse.rejetObligatoire') || 'Le motif de rejet est obligatoire');
            return;
        }

        try {
            setActionLoading(true);
            setError(null);
            await amortissementsService.validerDecaissement(idAmortissement, {
                approuve: approuve,
                motif: dgCommentaire
            });
            setDgCommentaire('');
            await fetchWorkflow();
            if (onWorkflowUpdated) onWorkflowUpdated();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Erreur lors de la décision.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComptableAction = async () => {
        try {
            setActionLoading(true);
            setError(null);
            await amortissementsService.validerEcriture(idAmortissement, {
                piece_justificative_url: null, // optionnel
                commentaire: comptableCommentaire
            });
            setComptableCommentaire('');
            await fetchWorkflow();
            if (onWorkflowUpdated) onWorkflowUpdated();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Erreur lors du verrouillage.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStaticUrl = (path) => {
        if (!path) return '';
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const domain = apiBase.replace('/api/v1', '');
        return `${domain}${path}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const steps = [
        { label: 'Calcul Comptable', role: 'COMPTABLE', key: 'COMPTABLE' },
        { label: 'Vérification Caisse', role: 'CAISSE', key: 'CAISSE' },
        { label: 'Validation DG', role: 'DG', key: 'DG' },
        { label: 'Validation Finale', role: 'COMPTABLE', key: 'COMPTABLE_VALIDATION' }
    ];

    const getStepStatus = (stepKey, index) => {
        const matchingVal = workflow?.historique_validations?.find(v => v.etape === stepKey);
        
        if (matchingVal) {
            if (matchingVal.statut === 'APPROUVE') return 'completed';
            if (matchingVal.statut === 'REJETE') return 'rejected';
            if (matchingVal.statut === 'SUSPENDU') return 'suspended';
            if (matchingVal.statut === 'EN_ATTENTE') return 'active';
        }
        
        // Si aucune ligne n'existe mais que la précédente est validée
        if (index === 0) return 'completed'; // La première étape est toujours faite à l'initialisation
        
        const prevStepKey = steps[index - 1].key;
        const prevStepVal = workflow?.historique_validations?.find(v => v.etape === prevStepKey);
        if (prevStepVal?.statut === 'APPROUVE') {
            if (workflow?.etape_actuelle === stepKey) return 'active';
        }
        
        return 'pending';
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                    {error}
                </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="relative flex justify-between items-center w-full bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="absolute top-[37px] left-10 right-10 h-0.5 bg-gray-200 dark:bg-slate-800 -z-0"></div>
                {steps.map((step, idx) => {
                    const status = getStepStatus(step.key, idx);
                    const isCompleted = status === 'completed';
                    const isActive = status === 'active';
                    const isRejected = status === 'rejected';
                    const isSuspended = status === 'suspended';

                    let circleClass = "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-500";
                    let icon = <ClockIcon className="h-5 w-5" />;

                    if (isCompleted) {
                        circleClass = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
                        icon = <CheckIcon className="h-5 w-5" />;
                    } else if (isActive) {
                        circleClass = "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950/50 shadow-lg shadow-primary-500/20";
                        icon = <SparklesIcon className="h-5 w-5 animate-pulse" />;
                    } else if (isRejected) {
                        circleClass = "bg-rose-500 text-white";
                        icon = <XMarkIcon className="h-5 w-5" />;
                    } else if (isSuspended) {
                        circleClass = "bg-amber-500 text-white animate-bounce";
                        icon = <ExclamationTriangleIcon className="h-5 w-5" />;
                    }

                    return (
                        <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${circleClass}`}>
                                {icon}
                            </div>
                            <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-500 dark:text-slate-400'}`}>
                                {step.label}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                {step.role}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Action Panel */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-5">
                <h4 className="text-md font-bold mb-4 border-b pb-2">Décisions et visas de validation</h4>

                {/* HISTORIQUE DETAILS */}
                <div className="space-y-3 mb-6">
                    {workflow?.historique_validations?.map((v, i) => {
                        if (v.statut === 'EN_ATTENTE') return null;
                        return (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg text-sm">
                                <div className="mt-0.5">
                                    {v.statut === 'APPROUVE' ? (
                                        <CheckIcon className="h-5 w-5 text-emerald-500" />
                                    ) : v.statut === 'REJETE' ? (
                                        <XMarkIcon className="h-5 w-5 text-rose-500" />
                                    ) : (
                                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="font-semibold text-gray-800 dark:text-slate-200">
                                            {v.etape === 'COMPTABLE' && 'Étape 1 : Calcul Amortissement'}
                                            {v.etape === 'CAISSE' && 'Étape 2 : Vérification Trésorerie'}
                                            {v.etape === 'DG' && 'Étape 3 : Validation Décaissement'}
                                            {v.etape === 'COMPTABLE_VALIDATION' && 'Étape 4 : Validation finale'}
                                        </p>
                                        <span className="text-xs text-gray-400">
                                            {v.date_validation ? formatDate(v.date_validation) : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                        Validé par : <span className="font-medium text-gray-700 dark:text-slate-300">{v.validateur_nom || 'Système'}</span>
                                    </p>
                                    {v.commentaire && (
                                        <p className="text-xs italic text-gray-600 dark:text-slate-400 mt-1 bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-800">
                                            "{v.commentaire}"
                                        </p>
                                    )}
                                    {v.bon_decaissement_pdf && (
                                        <div className="mt-2">
                                            <a
                                                href={getStaticUrl(v.bon_decaissement_pdf)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                <DocumentTextIcon className="h-4 w-4" />
                                                Bon de décaissement (BSC signé)
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FORMULAIRES D'ACTION SELON ETAPE & ROLE */}

                {/* ETAPE 2 : CAISSE */}
                {workflow?.etape_actuelle === 'CAISSE' && (
                    <div className="bg-primary-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-primary-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-primary-800 dark:text-primary-400 mb-3">
                            Action requise : Vérification physique des fonds en caisse
                        </p>
                        
                        {(currentRole === 'CAISSE' || currentRole === 'ADMIN') ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Commentaire ou observation
                                    </label>
                                    <textarea
                                        value={caisseCommentaire}
                                        onChange={(e) => setCaisseCommentaire(e.target.value)}
                                        className="form-input w-full dark:bg-slate-900"
                                        placeholder="Ex: Trésorerie disponible vérifiée..."
                                        rows="2"
                                        disabled={actionLoading}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="success"
                                        className="flex-1"
                                        onClick={() => handleCaisseAction(true)}
                                        disabled={actionLoading}
                                    >
                                        Confirmer la disponibilité des fonds
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={() => handleCaisseAction(false)}
                                        disabled={actionLoading}
                                    >
                                        Signaler des fonds insuffisants
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">
                                En attente de validation par le service de Caisse.
                            </p>
                        )}
                    </div>
                )}

                {/* ETAPE 3 : DG */}
                {workflow?.etape_actuelle === 'DG' && (
                    <div className="bg-primary-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-primary-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-primary-800 dark:text-primary-400 mb-3">
                            Action requise : Autorisation de décaissement (Visa de signature du BSC)
                        </p>

                        {(currentRole === 'DG' || currentRole === 'ADMIN') ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Motif de décision / Commentaire
                                    </label>
                                    <textarea
                                        value={dgCommentaire}
                                        onChange={(e) => setDgCommentaire(e.target.value)}
                                        className="form-input w-full dark:bg-slate-900"
                                        placeholder="Ex: Accordé pour traitement, rejeté car..."
                                        rows="2"
                                        disabled={actionLoading}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="success"
                                        className="flex-1"
                                        onClick={() => handleDGAction(true)}
                                        disabled={actionLoading}
                                    >
                                        Approuver le décaissement (Signer BSC)
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        onClick={() => handleDGAction(false)}
                                        disabled={actionLoading}
                                    >
                                        Rejeter
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">
                                En attente d'approbation et signature par la Direction Générale (DG).
                            </p>
                        )}
                    </div>
                )}

                {/* ETAPE 4 : COMPTABLE VALIDATION */}
                {workflow?.etape_actuelle === 'COMPTABLE_VALIDATION' && (
                    <div className="bg-primary-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-primary-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-primary-800 dark:text-primary-400 mb-3">
                            Action requise : Validation finale et verrouillage de l'écriture comptable
                        </p>

                        {(currentRole === 'COMPTABLE' || currentRole === 'ADMIN') ? (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-500 mb-2">
                                    Le bon de décaissement est signé par le DG. Le paiement a été ordonné en caisse. Veuillez valider définitivement l'écriture pour verrouiller l'exercice comptable.
                                </p>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                                        Commentaires finaux
                                    </label>
                                    <textarea
                                        value={comptableCommentaire}
                                        onChange={(e) => setComptableCommentaire(e.target.value)}
                                        className="form-input w-full dark:bg-slate-900"
                                        placeholder="Ex: Écriture enregistrée et verrouillée."
                                        rows="2"
                                        disabled={actionLoading}
                                    />
                                </div>
                                <Button
                                    variant="success"
                                    className="w-full text-center"
                                    onClick={handleComptableAction}
                                    disabled={actionLoading}
                                >
                                    Valider et Verrouiller l'écriture comptable
                                </Button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic">
                                En attente de validation finale par le Comptable.
                            </p>
                        )}
                    </div>
                )}

                {workflow?.statut_global === 'VALIDE_DEFINITIF' && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                        <CheckIcon className="h-6 w-6 text-emerald-500 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Workflow Terminé & Écriture verrouillée définitivement</p>
                            <p className="text-xs mt-1">
                                L'amortissement a validé toutes les étapes du workflow séquentiel avec succès. L'écriture comptable et l'amortissement associé sont verrouillés et non modifiables.
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default WorkflowAmortissement;
