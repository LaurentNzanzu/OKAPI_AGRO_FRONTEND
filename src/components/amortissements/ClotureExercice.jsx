// frontend/src/components/amortissements/ClotureExercice.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { useAuth } from '../../hooks/useAuth';
import {
  AppIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  TruckIcon,
  ComputerDesktopIcon,
} from '../ui/icons';
import ApercuCloture from './ApercuCloture';
import RapportCloture from './RapportCloture';

// ============================================================
// COMPOSANT DE SÉLECTION DE CATÉGORIE
// ============================================================
const CategorieSelect = ({ value, onChange, options }) => {
  const { t } = useTranslation();
  
  const getIcon = (cat) => {
    const icons = {
      vehicule: TruckIcon,
      machine: BuildingOffice2Icon,
      ordinateur: ComputerDesktopIcon,
      mobilier: Cog6ToothIcon,
    };
    return icons[cat] || Cog6ToothIcon;
  };

  return (
    <div className="categorie-select">
      <label className="form-label">{t('amortissementsCloture.categorieLabel')}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="form-input"
      >
        <option value="">{t('amortissementsCloture.allCategories')}</option>
        {options.map((cat) => (
          <option key={cat} value={cat}>
            {t(`categories.${cat}`, cat)}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================================
// COMPOSANT DE SÉLECTION DE MÉTHODE
// ============================================================
const MethodeSelect = ({ value, onChange }) => {
  const { t } = useTranslation();
  
  const methods = [
    { value: '', label: t('amortissementsCloture.methodeAuto') },
    { value: 'LINEAIRE', label: t('amortissementsCloture.methodeLineaire') },
    { value: 'DEGRESSIF', label: t('amortissementsCloture.methodeDegressif') },
    { value: 'COMPOSANTS', label: t('amortissementsCloture.methodeComposants') },
  ];

  return (
    <div className="methode-select">
      <label className="form-label">{t('amortissementsCloture.methodeLabel')}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="form-input"
      >
        {methods.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
};

// ============================================================
// COMPOSANT DE FORMATAGE DE PRIX
// ============================================================
const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XAF',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// ============================================================
// COMPOSANT PRINCIPAL - CLÔTURE EXERCICE
// ============================================================
const ClotureExercice = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManageAmortissements = hasPermission('amortissements.create');
  
  const [exercice, setExercice] = useState(new Date().getFullYear());
  const [categorie, setCategorie] = useState(null);
  const [methodeForcee, setMethodeForcee] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedBiens, setSelectedBiens] = useState([]);
  const [showApercu, setShowApercu] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('config'); // config | preview | processing | done

  // Charger les catégories disponibles
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const regles = await amortissementsService.getRegles();
      const cats = regles.map(r => r.categorie_bien).filter(Boolean);
      setCategories(cats);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setCategories(['vehicule', 'machine', 'ordinateur', 'mobilier']);
    }
  };

  // Prévisualiser la clôture
  const handlePreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      const data = await amortissementsService.previsualiserCloture({
        exercice,
        categorie,
        methode_forcee: methodeForcee || undefined,
      });
      
      setPreviewData(data);
      
      if (data.biens && data.biens.length > 0) {
        setSelectedBiens(data.biens.filter(b => b.est_eligible).map(b => b.id_bien));
        setShowApercu(true);
        setStep('preview');
      } else {
        setError(t('amortissementsCloture.noBiensToClose') || 'Aucun bien éligible pour la clôture');
      }
    } catch (err) {
      console.error('Erreur prévisualisation:', err);
      setError(err.response?.data?.detail || t('amortissementsCloture.previewError'));
    } finally {
      setLoadingPreview(false);
    }
  };

  // Exécuter la clôture
  const handleCloture = async () => {
    setLoading(true);
    setError(null);
    setStep('processing');
    setProgress(0);
    
    try {
      // Simuler la progression pour l'UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const result = await amortissementsService.cloturerExerciceAvecFiltres({
        exercice,
        categorie,
        methode_forcee: methodeForcee || undefined,
        biens_selectionnes: selectedBiens.length > 0 ? selectedBiens : undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);
      setStep('done');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Erreur clôture:', err);
      setError(err.response?.data?.detail || t('amortissementsCloture.error'));
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la sélection des biens
  const handleToggleAllBiens = () => {
    const eligibleIds = previewData?.biens.filter(b => b.est_eligible).map(b => b.id_bien) || [];
    const allSelected = eligibleIds.every(id => selectedBiens.includes(id));
    
    if (allSelected) {
      setSelectedBiens([]);
    } else {
      setSelectedBiens(eligibleIds);
    }
  };

  const handleToggleBien = (id) => {
    setSelectedBiens(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setStep('config');
    setResult(null);
    setError(null);
    setPreviewData(null);
    setShowApercu(false);
    setSelectedBiens([]);
    setProgress(0);
    onClose();
  };

  const handleViewEcritures = () => {
    handleClose();
    window.location.href = '/amortissements/ecritures';
  };

  if (!isOpen) return null;

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="cloture-modal-overlay" onClick={handleClose}>
      <div className="cloture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cloture-modal-header">
          <h2 className="cloture-modal-title">
            <AppIcon icon={CalendarDaysIcon} size="md" />
            {t('amortissementsCloture.title')}
          </h2>
          <button className="cloture-modal-close" onClick={handleClose}>
            <AppIcon icon={XMarkIcon} size="md" />
          </button>
        </div>

        <div className="cloture-modal-body">
          {/* Erreur */}
          {error && (
            <div className="cloture-error">
              <AppIcon icon={XCircleIcon} size="sm" />
              {error}
            </div>
          )}

          {/* ÉTAPE 1: CONFIGURATION */}
          {step === 'config' && (
            <div className="cloture-config">
              <div className="cloture-config-field">
                <label className="form-label">{t('amortissementsCloture.exerciceLabel')}</label>
                <input
                  type="number"
                  className="form-input"
                  value={exercice}
                  onChange={(e) => setExercice(Number(e.target.value))}
                  min={2000}
                  max={2100}
                />
              </div>

              <CategorieSelect
                value={categorie}
                onChange={setCategorie}
                options={categories}
              />

              <MethodeSelect
                value={methodeForcee}
                onChange={setMethodeForcee}
              />

              <div className="cloture-config-info">
                <AppIcon icon={ClockIcon} size="sm" />
                <span>{t('amortissementsCloture.configHint')}</span>
              </div>

              <div className="cloture-config-actions">
                <button 
                  className="btn-secondary"
                  onClick={handlePreview}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="spinner w-4 h-4 border-2 border-primary-600 border-t-transparent"></div>
                      {t('common.loading')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <AppIcon icon={EyeIcon} size="sm" />
                      {t('amortissementsCloture.voirBiens')}
                    </span>
                  )}
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleCloture}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="spinner w-4 h-4 border-2 border-white border-t-transparent"></div>
                      {t('amortissementsCloture.closing')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <AppIcon icon={ArrowPathIcon} size="sm" className="text-white" />
                      {t('amortissementsCloture.closeBtn', { year: exercice })}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2: APERÇU DES BIENS */}
          {step === 'preview' && showApercu && previewData && (
            <div className="cloture-preview">
              <div className="cloture-preview-summary">
                <span>
                  {t('amortissementsCloture.biensEligibles', { 
                    count: previewData.total_eligibles,
                    total: previewData.total_biens
                  })}
                </span>
                <span>
                  {t('amortissementsCloture.montantTotal', {
                    amount: formatPrice(previewData.total_montant_estime)
                  })}
                </span>
              </div>

              <ApercuCloture
                biens={previewData.biens}
                selectedIds={selectedBiens}
                onToggleAll={handleToggleAllBiens}
                onToggleBien={handleToggleBien}
                onClose={() => {
                  setShowApercu(false);
                  setStep('config');
                }}
              />

              <div className="cloture-preview-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowApercu(false);
                    setStep('config');
                  }}
                >
                  {t('common.back')}
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowApercu(false);
                    handleCloture();
                  }}
                  disabled={selectedBiens.length === 0}
                >
                  <AppIcon icon={ArrowPathIcon} size="sm" className="text-white" />
                  {t('amortissementsCloture.confirmCloture')}
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: TRAITEMENT EN COURS */}
          {step === 'processing' && (
            <div className="cloture-progress">
              <div className="cloture-progress-bar">
                <div className="cloture-progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="cloture-progress-text">
                <span>{t('amortissementsCloture.progress', { percent: progress })}</span>
                <span>{t('amortissementsCloture.processing')}</span>
              </div>
              <div className="cloture-progress-spinner">
                <div className="spinner"></div>
              </div>
            </div>
          )}

          {/* ÉTAPE 4: RAPPORT */}
          {step === 'done' && result && (
            <RapportCloture
              result={result}
              onClose={handleClose}
              onViewEcritures={handleViewEcritures}
            />
          )}
        </div>

        {/* Pied de page avec conseil */}
        {step === 'config' && (
          <div className="cloture-modal-footer">
            <AppIcon icon={ExclamationTriangleIcon} size="xs" />
            <span>{t('amortissementsCloture.footerHint')}</span>
          </div>
        )}
      </div>

      <style>{`
        /* ============================================================
           STYLES CLÔTURE EXERCICE
           ============================================================ */
        
        /* Overlay et Modal */
        .cloture-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .cloture-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 680px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .dark .cloture-modal {
          background: #1f2937;
        }

        /* Header */
        .cloture-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .dark .cloture-modal-header {
          border-bottom-color: #334155;
        }
        .cloture-modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }
        .dark .cloture-modal-title {
          color: #f1f5f9;
        }
        .cloture-modal-close {
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          transition: background 0.2s;
        }
        .cloture-modal-close:hover {
          background: #f1f5f9;
        }
        .dark .cloture-modal-close:hover {
          background: #273449;
        }

        /* Body */
        .cloture-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        /* Footer */
        .cloture-modal-footer {
          padding: 14px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          align-items: center;
          gap: 10px; 
          font-size: 13px;
          color: #64748b;
          flex-shrink: 0;
        }
        .dark .cloture-modal-footer {
          border-top-color: #334155;
          background: #1a2538;
          color: #94a3b8;
        }

        /* Configuration */
        .cloture-config {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cloture-config-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cloture-config-info {
          padding: 12px 16px;
          background: #f0f4f8;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #475569;
        }
        .dark .cloture-config-info {
          background: #1a2538;
          color: #94a3b8;
        }
        .cloture-config-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .cloture-config-actions button {
          flex: 1;
        }

        /* Erreur */
        .cloture-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .dark .cloture-error {
          background: rgba(127, 29, 29, 0.25);
          color: #fca5a5;
        }

        /* Sélecteurs */
        .categorie-select, .methode-select {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Preview */
        .cloture-preview {
          display: flex; 
          flex-direction: column;
          gap: 16px;
        }
        .cloture-preview-summary {
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f0f4f8;
          border-radius: 8px;
          font-size: 13px;
          color: #475569;
        }
        .dark .cloture-preview-summary {
          background: #1a2538;
          color: #94a3b8;
        }
        .cloture-preview-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .cloture-preview-actions button {
          flex: 1;
        }

        /* Progression */
        .cloture-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px 0;
        }
        .cloture-progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .dark .cloture-progress-bar {
          background: #334155;
        }
        .cloture-progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .cloture-progress-text {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 14px;
          color: #475569;
        }
        .dark .cloture-progress-text {
          color: #94a3b8;
        }
        .cloture-progress-spinner {
          display: flex;
          justify-content: center;
          padding: 8px 0;
        }
        .cloture-progress-spinner .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .dark .cloture-progress-spinner .spinner {
          border-color: #334155;
          border-top-color: #667eea;
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .cloture-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
            margin: 0;
          }
          .cloture-modal-body {
            padding: 16px;
          }
          .cloture-config-actions,
          .cloture-preview-actions {
            flex-direction: column;
          }
          .cloture-config-actions button,
          .cloture-preview-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ClotureExercice;