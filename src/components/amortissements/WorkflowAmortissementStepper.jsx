import React, { useState, useEffect } from 'react';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    ExclamationTriangleIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    BanknotesIcon,
    UserIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const WorkflowAmortissementStepper = ({ idAmortissement, onWorkflowUpdate }) => {
    const { user } = useAuth();
    const [workflowData, setWorkflowData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Extraction robuste des rôles utilisateurs
    const getUserRoles = () => {
        if (!user) return [];
        let roles = [];
        if (Array.isArray(user.roles)) {
            roles = user.roles.map(r => typeof r === 'object' ? (r.nom || r.name || r.role_nom) : r);
        } else if (typeof user.roles === 'string') {
            roles = [user.roles];
        } else if (user.role) {
            roles = [typeof user.role === 'object' ? (user.role.nom || user.role.name || user.role.role_nom) : user.role];
        } else if (user.role_nom) {
            roles = [user.role_nom];
        }
        return roles.filter(Boolean).map(r => String(r).trim().toUpperCase());
    };

    const userRoles = getUserRoles();
    const isAdmin = userRoles.some(r => r.includes('ADMIN'));
    const canActOnCaisse = isAdmin || userRoles.some(r => r.includes('CAISSE') || r.includes('CAISSIER'));
    const canActOnDg = isAdmin || userRoles.some(r => r.includes('DG') || r.includes('DIRECTEUR'));
    const canActOnComptable = isAdmin || userRoles.some(r => r.includes('COMPTABL'));

    // Form states
    const [tresorerieDisponible, setTresorerieDisponible] = useState(true);
    const [commentaireCaisse, setCommentaireCaisse] = useState('');
    const [approuveDg, setApprouveDg] = useState(true);
    const [motifDg, setMotifDg] = useState('');
    const [pieceUrl, setPieceUrl] = useState('');
    const [commentaireComptable, setCommentaireComptable] = useState('');

    const fetchWorkflowStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/amortissements/${idAmortissement}/workflow-status`);
            setWorkflowData(res.data);
        } catch (err) {
            console.warn("Status workflow non chargé ou non initialisé pour bien/amortissement", idAmortissement);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (idAmortissement) {
            fetchWorkflowStatus();
        }
    }, [idAmortissement]);

    const handleVerifierTresorerie = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.post(`/amortissements/${idAmortissement}/verifier-tresorerie`, {
                tresorerie_disponible: tresorerieDisponible,
                commentaire: commentaireCaisse
            });
            setSuccess("Vérification de trésorerie enregistrée avec succès !");
            fetchWorkflowStatus();
            if (onWorkflowUpdate) onWorkflowUpdate();
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de la vérification de trésorerie.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleValiderDecaissement = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.post(`/amortissements/${idAmortissement}/valider-decaissement`, {
                approuve: approuveDg,
                motif: motifDg
            });
            setSuccess("Décaissement " + (approuveDg ? "approuvé" : "rejeté") + " avec succès ! Bon de décaissement généré.");
            fetchWorkflowStatus();
            if (onWorkflowUpdate) onWorkflowUpdate();
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de la validation du décaissement.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleValiderEcriture = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.post(`/amortissements/${idAmortissement}/valider-ecriture`, {
                piece_justificative_url: pieceUrl,
                commentaire: commentaireComptable
            });
            setSuccess("Écriture comptable validée et amortissement verrouillé définitivement !");
            fetchWorkflowStatus();
            if (onWorkflowUpdate) onWorkflowUpdate();
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de la validation comptable finale.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadBonPdf = async (e) => {
        if (e) e.preventDefault();
        try {
            const response = await api.get(`/amortissements/${idAmortissement}/bon-decaissement-pdf`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bon_decaissement_amortissement_${idAmortissement}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erreur lors du téléchargement du bon de décaissement:", err);
            setError("Erreur lors du téléchargement du bon de décaissement.");
        }
    };

    if (loading) {
        return (
            <div className="p-4 text-center text-gray-500">
                <ClockIcon className="w-6 h-6 animate-spin mx-auto mb-2" />
                Chargement du workflow de validation...
            </div>
        );
    }

    if (!workflowData || !workflowData.historique_validations) return null;

    const stepsConfig = [
        { key: 'COMPTABLE', label: '1. Calcul & Brouillon', role: 'Comptable', icon: DocumentTextIcon },
        { key: 'CAISSE', label: '2. Vérification Caisse', role: 'Caissier', icon: BanknotesIcon },
        { key: 'DG', label: '3. Validation Décaissement', role: 'DG', icon: UserIcon },
        { key: 'COMPTABLE_VALIDATION', label: '4. Clôture & Verrouillage', role: 'Comptable', icon: LockClosedIcon },
    ];

    const getStepData = (stepKey) => {
        return workflowData.historique_validations.find(v => v.etape === stepKey);
    };

    const isWorkflowStopped = workflowData.statut_global === 'SUSPENDU' || workflowData.statut_global === 'REJETE';

    const isStepActive = (stepKey) => {
        if (isWorkflowStopped) return false;
        const stepData = getStepData(stepKey);
        return workflowData.etape_actuelle === stepKey && stepData && stepData.statut === 'EN_ATTENTE';
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 border border-gray-100 dark:border-slate-800 mb-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Workflow de Validation en 4 Étapes</span>
                        {workflowData.statut_global === 'VALIDE_DEFINITIF' && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 flex items-center gap-1">
                                <LockClosedIcon className="w-3.5 h-3.5" /> Verrouillé Définitivement
                            </span>
                        )}
                        {workflowData.statut_global === 'SUSPENDU' && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 flex items-center gap-1">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Opération Suspendue (Caisse)
                            </span>
                        )}
                        {workflowData.statut_global === 'REJETE' && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 flex items-center gap-1">
                                <XCircleIcon className="w-3.5 h-3.5" /> Opération Rejetée (DG)
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Gouvernance SYSCOHADA : COMPTABLE ➔ CAISSE ➔ DG ➔ COMPTABLE</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* Stepper Visuel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {stepsConfig.map((st) => {
                    const data = getStepData(st.key);
                    const active = isStepActive(st.key);
                    const Icon = st.icon;

                    let statusBg = "bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700";
                    let badge = <span className="text-xs text-gray-400 font-medium">Non démarré</span>;

                    if (data) {
                        if (data.statut === 'APPROUVE') {
                            statusBg = "bg-green-50 dark:bg-green-950/30 border-green-500 text-green-600";
                            badge = <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Approuvé</span>;
                        } else if (data.statut === 'EN_ATTENTE') {
                            statusBg = "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-600 animate-pulse";
                            badge = <span className="text-xs text-amber-600 font-bold flex items-center gap-1"><ClockIcon className="w-4 h-4" /> En attente</span>;
                        } else if (data.statut === 'SUSPENDU') {
                            statusBg = "bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-600";
                            badge = <span className="text-xs text-orange-600 font-bold flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4" /> Suspendu</span>;
                        } else if (data.statut === 'REJETE') {
                            statusBg = "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-600";
                            badge = <span className="text-xs text-red-600 font-bold flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Rejeté</span>;
                        }
                    }

                    return (
                        <div key={st.key} className={`p-4 rounded-xl border-2 transition-all ${statusBg} ${active ? 'ring-2 ring-primary-500 shadow-md' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                                    <Icon className="w-5 h-5" />
                                </div>
                                {badge}
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-slate-100">{st.label}</h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Rôle : {st.role}</p>
                            {data && data.validateur_nom && (
                                <p className="text-[11px] text-gray-600 dark:text-slate-300 truncate">Par : {data.validateur_nom}</p>
                            )}
                            {data && data.bon_decaissement_pdf && (
                                <button 
                                    type="button"
                                    onClick={handleDownloadBonPdf}
                                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold underline cursor-pointer bg-transparent border-0 p-0"
                                >
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Bon Décaissement PDF
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* BANNIÈRE SI L'OPÉRATION EST ARRÊTÉE (SUSPENDUE OU REJETÉE) */}
            {isWorkflowStopped && (
                <div className="p-5 bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500 rounded-xl flex items-start gap-4">
                    <ExclamationTriangleIcon className="w-7 h-7 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-orange-900 dark:text-orange-200 text-base mb-1">
                            ⛔ Opération Interrompue ({workflowData.statut_global})
                        </h4>
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                            {workflowData.statut_global === 'SUSPENDU' 
                                ? "La Caisse a indiqué une insuffisance de trésorerie physique (NON). Le workflow est arrêté à l'étape 2. Aucun décaissement ni écriture finale ne peut avoir lieu."
                                : "La Direction Générale a rejeté l'autorisation de décaissement (NON). Le workflow est définitivement clôturé par rejet."
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* ÉTAPE 2 : CAISSE */}
            {isStepActive('CAISSE') && (
                <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-amber-600" /> Étape 2 : Vérification des fonds en Caisse
                    </h4>
                    {canActOnCaisse ? (
                        <form onSubmit={handleVerifierTresorerie} className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input 
                                        type="radio" 
                                        name="treso" 
                                        checked={tresorerieDisponible === true} 
                                        onChange={() => setTresorerieDisponible(true)} 
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-green-700 dark:text-green-400 font-semibold">✅ Fonds physiques disponibles (OUI)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input 
                                        type="radio" 
                                        name="treso" 
                                        checked={tresorerieDisponible === false} 
                                        onChange={() => setTresorerieDisponible(false)} 
                                        className="text-danger focus:ring-danger"
                                    />
                                    <span className="text-red-700 dark:text-red-400 font-semibold">❌ Fonds insuffisants (NON - Arrêter l'opération)</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Commentaire / Observation Caisse</label>
                                <input 
                                    type="text"
                                    value={commentaireCaisse}
                                    onChange={(e) => setCommentaireCaisse(e.target.value)}
                                    placeholder="Ex: Fonds vérifiés en caisse principale..."
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center"
                            >
                                {submitting ? "Enregistrement..." : "Valider l'étape Caisse"}
                            </button>
                        </form>
                    ) : (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <span>🔒 <b>Action réservée au Responsable Caisse.</b> En attente de la vérification de la trésorerie physique par la Caisse.</span>
                        </div>
                    )}
                </div>
            )}

            {/* ÉTAPE 3 : DG */}
            {isStepActive('DG') && (
                <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-600" /> Étape 3 : Autorisation de décaissement par la Direction Générale
                    </h4>
                    {canActOnDg ? (
                        <form onSubmit={handleValiderDecaissement} className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input 
                                        type="radio" 
                                        name="dg_app" 
                                        checked={approuveDg === true} 
                                        onChange={() => setApprouveDg(true)} 
                                        className="text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-green-700 dark:text-green-400 font-semibold">✅ Approuver et générer Bon de Décaissement</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                    <input 
                                        type="radio" 
                                        name="dg_app" 
                                        checked={approuveDg === false} 
                                        onChange={() => setApprouveDg(false)} 
                                        className="text-danger focus:ring-danger"
                                    />
                                    <span className="text-red-700 dark:text-red-400 font-semibold">❌ Rejeter le décaissement</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Motif / Instructions de la DG</label>
                                <textarea 
                                    value={motifDg}
                                    onChange={(e) => setMotifDg(e.target.value)}
                                    placeholder="Instructions complémentaires pour la comptabilité..."
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                                    rows="2"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center"
                            >
                                {submitting ? "Traitement et Génération PDF..." : "Confirmer la décision DG"}
                            </button>
                        </form>
                    ) : (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span>🔒 <b>Action réservée à la Direction Générale (DG).</b> La Caisse a validé la trésorerie. En attente de la signature du bon de décaissement par le DG.</span>
                        </div>
                    )}
                </div>
            )}

            {/* ÉTAPE 4 : COMPTABLE_VALIDATION */}
            {isStepActive('COMPTABLE_VALIDATION') && (
                <div className="p-5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/50">
                    <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                        <LockClosedIcon className="w-5 h-5 text-purple-600" /> Étape 4 : Validation finale et Verrouillage par le Comptable
                    </h4>
                    {canActOnComptable ? (
                        <form onSubmit={handleValiderEcriture} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">URL de la Pièce Justificative (PDF scanné / Bon joint)</label>
                                <input 
                                    type="text"
                                    value={pieceUrl}
                                    onChange={(e) => setPieceUrl(e.target.value)}
                                    placeholder="Ex: /uploads/pieces/bon_decaissement_signe.pdf"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Commentaire de validation finale</label>
                                <input 
                                    type="text"
                                    value={commentaireComptable}
                                    onChange={(e) => setCommentaireComptable(e.target.value)}
                                    placeholder="Ex: Écriture vérifiée et verrouillée définitivement."
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center"
                            >
                                {submitting ? "Verrouillage..." : "Valider et Verrouiller Définitivement"}
                            </button>
                        </form>
                    ) : (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                            <span>🔒 <b>Action réservée à la Comptabilité.</b> Le bon de décaissement est signé par le DG. En attente du verrouillage final par le comptable.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkflowAmortissementStepper;
