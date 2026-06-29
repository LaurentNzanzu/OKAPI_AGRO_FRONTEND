// frontend/src/components/validations/WorkflowValidation.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { validationsService } from '../../services/validations';
import { formatDate } from '../../utils/formatters';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';

const WorkflowValidation = ({ workflow, besoinId, onRefresh }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null); // 'success' | 'error' | null

  if (!workflow) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        {t('validationsWorkflow.noData')}
      </div>
    );
  }

  // ✅ Ordre correct : COMPTABLE → CAISSE → DG
  const STEPS = [
    { 
      ordre: 'COMPTABLE', 
      label: t('validationsWorkflow.comptable'), 
      icon: DocumentTextIcon,
      description: t('validationsWorkflow.comptableDesc'),
      verificationKey: 'verification_budget'
    },
    { 
      ordre: 'CAISSE', 
      label: t('validationsWorkflow.caisse'), 
      icon: CalendarDaysIcon,
      description: t('validationsWorkflow.caisseDesc'),
      verificationKey: 'verification_tresorerie'
    },
    { 
      ordre: 'DG', 
      label: t('validationsWorkflow.dg'), 
      icon: UserIcon,
      description: t('validationsWorkflow.dgDesc'),
      verificationKey: null
    }
  ];

  const getStepStatus = (ordre) => {
    const validation = workflow.validations_realisees?.find(
      v => v.ordre === ordre
    );

    if (!validation) {
      return {
        status: 'pending',
        label: t('validationsWorkflow.pending'),
        color: 'text-gray-400 dark:text-slate-500',
        bgColor: 'bg-gray-100 dark:bg-night-muted',
        icon: ClockIcon
      };
    }

    if (validation.decision === 'APPROUVE') {
      return {
        status: 'approved',
        label: t('validationsWorkflow.approved'),
        color: 'text-success',
        bgColor: 'bg-success/10',
        icon: CheckCircleIcon
      };
    }

    if (validation.decision === 'REJETE') {
      return {
        status: 'rejected',
        label: t('validationsWorkflow.rejected'),
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        icon: XCircleIcon
      };
    }

    return {
      status: 'pending',
      label: t('validationsWorkflow.inProgress'),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: ClockIcon
    };
  };

  // ✅ Déterminer l'étape actuelle en fonction du statut
  const getCurrentStepIndex = () => {
    const statut = workflow.statut_actuel;
    if (statut === 'EN_ATTENTE_COMPTABLE') return 0;
    if (statut === 'COMPTABLE_VALIDE') return 1;
    if (statut === 'CAISSE_VALIDE') return 2;
    if (statut === 'APPROUVEE') return 3;
    if (statut === 'REJETE') return -1;
    return 0;
  };

  // ✅ Déterminer si une vérification est requise pour l'étape actuelle
  const getCurrentStepVerification = () => {
    const index = getCurrentStepIndex();
    if (index >= 0 && index < STEPS.length) {
      const step = STEPS[index];
      if (step.verificationKey && workflow[step.verificationKey]) {
        return workflow[step.verificationKey];
      }
    }
    return null;
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCompleted = workflow.statut_actuel === 'APPROUVEE';
  const isRejected = workflow.statut_actuel === 'REJETE';
  const currentVerification = getCurrentStepVerification();

  // Vérifier si l'utilisateur peut valider (étape actuelle)
  const canValidate = () => {
    // Si la vérification échoue, on ne peut pas valider
    if (currentVerification && !currentVerification.est_disponible) {
      return false;
    }
    return true;
  };

  // ✅ Fonction robuste pour extraire le message d'erreur
  const getErrorMessage = (err) => {
    if (!err) return null;
    
    // Si c'est une chaîne, la retourner directement
    if (typeof err === 'string') return err;
    
    // Si c'est une erreur axios avec response
    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      // Si c'est un tableau d'erreurs Pydantic
      if (Array.isArray(detail)) {
        return detail.map(d => d.msg || d).join(', ');
      }
      return detail;
    }
    
    // Si c'est une erreur avec un message
    if (err.message) return err.message;
    
    // Fallback
    return 'Une erreur est survenue';
  };

  const handleApprove = async () => {
    if (!besoinId) {
      setError("L'identifiant du besoin est manquant");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationStatus(null);
    
    try {
      await validationsService.approuver(besoinId, { commentaire: '' });
      setValidationStatus('success');
      if (onRefresh) {
        setTimeout(() => onRefresh(), 500);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setValidationStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!besoinId) {
      setError("L'identifiant du besoin est manquant");
      return;
    }

    if (!rejectMotif.trim()) {
      setError(t('validationsWorkflow.rejectMotifRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setValidationStatus(null);
    
    try {
      await validationsService.rejeter(besoinId, { 
        motif_rejet: rejectMotif 
      });
      setValidationStatus('success');
      if (onRefresh) {
        setTimeout(() => onRefresh(), 500);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setValidationStatus('error');
    } finally {
      setLoading(false);
      setShowRejectForm(false);
      setRejectMotif('');
    }
  };

  // ✅ Fonction de rendu pour une étape de vérification
  const renderVerificationStep = (verification, label, stepNumber) => {
    if (!verification) return null;
    
    const isAvailable = verification.est_disponible !== undefined ? verification.est_disponible : verification.est_suffisante;
    const message = verification.message || (isAvailable ? 'Vérification réussie' : 'Vérification échouée');
    const isCurrent = currentVerification === verification;

    return (
      <div className={`p-3 rounded-lg border flex items-start gap-3 ${
        isAvailable 
          ? 'bg-success/5 border-success/20' 
          : 'bg-danger/5 border-danger/20'
      } ${isCurrent ? 'ring-2 ring-primary-500/30' : ''}`}>
        <AppIcon 
          icon={isAvailable ? CheckCircleIcon : XCircleIcon} 
          size="md" 
          className={isAvailable ? 'text-success' : 'text-danger'} 
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300">
              Étape {stepNumber} : {label}
            </h4>
            {isCurrent && (
              <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                {t('validationsWorkflow.currentStep')}
              </span>
            )}
          </div>
          <p className={`text-sm font-medium ${isAvailable ? 'text-success' : 'text-danger'}`}>
            {isAvailable ? '✅ Vérification réussie' : '❌ Vérification échouée'}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {message}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête du workflow */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          {t('validationsWorkflow.title')}
        </h3>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {t('validationsWorkflow.requestNumber', { number: workflow.numero_demande || besoinId })}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="relative">
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.ordre);
            const isActive = index === currentStepIndex;
            const isPast = index < currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div key={step.ordre} className="flex flex-col items-center flex-1">
                <div className="relative">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isPast ? 'bg-success text-white' : ''}
                      ${isActive ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900/50' : ''}
                      ${isFuture ? 'bg-gray-200 dark:bg-night-muted text-gray-400 dark:text-slate-500' : ''}
                      ${status.status === 'rejected' ? 'bg-danger text-white' : ''}
                    `}
                  >
                    <AppIcon 
                      icon={status.icon} 
                      size="sm" 
                      className={isFuture ? 'text-gray-400 dark:text-slate-500' : ''}
                    />
                  </div>
                  {index < STEPS.length - 1 && (
                    <div 
                      className={`
                        absolute top-5 left-[calc(100%+4px)] w-[calc(100%-8px)] h-0.5
                        ${isPast ? 'bg-success' : 'bg-gray-200 dark:bg-night-muted'}
                      `}
                    />
                  )}
                </div>
                <span className="text-xs font-medium mt-2 text-center text-gray-700 dark:text-slate-300">
                  {step.label}
                </span>
                <span className={`text-xs ${status.color}`}>
                  {status.label}
                </span>
                {isActive && !isCompleted && !isRejected && (
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-0.5">
                    {t('validationsWorkflow.currentStep')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ Bloc des vérifications préalables intégré */}
      {workflow.verification_budget && (
        renderVerificationStep(
          workflow.verification_budget, 
          'Solde Budgétaire', 
          1
        )
      )}
      
      {workflow.verification_tresorerie && (
        renderVerificationStep(
          workflow.verification_tresorerie, 
          'Trésorerie Caisse', 
          2
        )
      )}

      {/* Statut global */}
      <div className={`
        p-4 rounded-lg border
        ${isCompleted ? 'border-success bg-success/5' : ''}
        ${isRejected ? 'border-danger bg-danger/5' : ''}
        ${!isCompleted && !isRejected ? 'border-primary-200 bg-primary-50 dark:border-primary-900/30 dark:bg-primary-900/10' : ''}
      `}>
        <div className="flex items-center gap-3">
          {isCompleted && (
            <>
              <AppIcon icon={CheckCircleIcon} size="lg" className="text-success" />
              <div>
                <p className="font-medium text-success">{t('validationsWorkflow.requestApproved')}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {t('validationsWorkflow.requestApprovedDesc')}
                </p>
              </div>
            </>
          )}
          {isRejected && (
            <>
              <AppIcon icon={XCircleIcon} size="lg" className="text-danger" />
              <div>
                <p className="font-medium text-danger">{t('validationsWorkflow.requestRejected')}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {t('validationsWorkflow.requestRejectedDesc')}
                </p>
              </div>
            </>
          )}
          {!isCompleted && !isRejected && (
            <>
              <AppIcon icon={ClockIcon} size="lg" className="text-warning" />
              <div>
                <p className="font-medium text-warning">{t('validationsWorkflow.waitingValidation')}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {t('validationsWorkflow.waitingValidationDesc', { 
                    step: STEPS[currentStepIndex]?.label || '' 
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ Message de succès/erreur après validation */}
      {validationStatus === 'success' && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
          ✅ {t('validationsWorkflow.validationSuccess')}
        </div>
      )}

      {/* Historique des validations */}
      {workflow.validations_realisees?.length > 0 && (
        <Card title={t('validationsWorkflow.history')} compact>
          <div className="space-y-3">
            {workflow.validations_realisees.map((validation, idx) => {
              const isApproved = validation.decision === 'APPROUVE';
              return (
                <div 
                  key={idx} 
                  className={`
                    p-3 rounded-lg border
                    ${isApproved ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isApproved ? (
                          <AppIcon icon={CheckCircleIcon} size="sm" className="text-success" />
                        ) : (
                          <AppIcon icon={XCircleIcon} size="sm" className="text-danger" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-slate-100">
                          {validation.ordre}
                        </span>
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${isApproved ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
                        `}>
                          {validation.decision}
                        </span>
                      </div>
                      {validation.validateur && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                          <AppIcon icon={UserIcon} size="xs" className="inline mr-1" />
                          {validation.validateur}
                        </p>
                      )}
                      {validation.date && (
                        <p className="text-xs text-gray-500 dark:text-slate-500">
                          <AppIcon icon={CalendarDaysIcon} size="xs" className="inline mr-1" />
                          {formatDate(validation.date) || 'Date invalide'}
                        </p>
                      )}
                      {validation.commentaire && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 italic">
                          <AppIcon icon={ChatBubbleLeftRightIcon} size="xs" className="inline mr-1" />
                          "{validation.commentaire}"
                        </p>
                      )}
                      {validation.motif_rejet && (
                        <p className="text-sm text-danger mt-1">
                          <AppIcon icon={XMarkIcon} size="xs" className="inline mr-1" />
                          {t('validationsWorkflow.rejectMotif')}: {validation.motif_rejet}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions de validation */}
      {canValidate() && !isCompleted && !isRejected && (
        <div className="flex flex-col gap-3 pt-4 border-t border-border-light dark:border-border-dark">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {t('validationsWorkflow.actionPrompt')}
          </p>
          
          {/* ✅ Affichage de l'erreur robuste */}
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              ❌ {typeof error === 'string' ? error : 'Une erreur est survenue'}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="success"
              onClick={handleApprove}
              isLoading={loading && !showRejectForm}
              disabled={loading || !canValidate()}
            >
              <AppIcon icon={CheckIcon} size="sm" className="mr-1" />
              {loading ? t('common.loading') : t('validationsWorkflow.approve')}
            </Button>

            {!showRejectForm ? (
              <Button
                variant="danger"
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
              >
                <AppIcon icon={XMarkIcon} size="sm" className="mr-1" />
                {t('validationsWorkflow.reject')}
              </Button>
            ) : (
              <div className="flex-1 flex flex-wrap gap-3 items-start">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('validationsWorkflow.rejectMotif')} <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={rejectMotif}
                    onChange={(e) => setRejectMotif(e.target.value)}
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    rows="2"
                    placeholder={t('validationsWorkflow.rejectMotifPlaceholder')}
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    isLoading={loading}
                    disabled={loading || !rejectMotif.trim()}
                  >
                    {t('validationsWorkflow.confirmReject')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectMotif('');
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* ✅ Indicateur de progression si chargement */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              {t('common.loading')}
            </div>
          )}
        </div>
      )}

      {/* ✅ Message si l'utilisateur ne peut pas valider */}
      {!canValidate() && !isCompleted && !isRejected && currentVerification && !currentVerification.est_disponible && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
          ⚠️ {t('validationsWorkflow.cannotValidate')}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-border-light dark:border-border-dark">
        <Button
          variant="outline"
          onClick={() => navigate(`/validations/historique`)}
        >
          {t('validationsWorkflow.viewHistory')}
        </Button>
      </div>
    </div>
  );
};

export default WorkflowValidation;