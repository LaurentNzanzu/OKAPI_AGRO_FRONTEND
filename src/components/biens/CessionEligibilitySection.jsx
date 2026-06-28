import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { biensService } from '../../services/biens';
import { formatPrice } from '../../utils/formatters';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';
import Button from '../ui/Button';

// Ce composant est conçu pour être intégré dans FicheBien.jsx
const CessionEligibilitySection = ({ bienId, onCessionClick }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [eligibilite, setEligibilite] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bienId) {
      fetchEligibilite();
    }
  }, [bienId]);

  const fetchEligibilite = async () => {
    try {
      setLoading(true);
      const data = await biensService.verifierEligibiliteCession(bienId);
      setEligibilite(data);
      setError(null);
    } catch (err) {
      console.error('Erreur vérification éligibilité:', err);
      setError(err.response?.data?.detail || t('assets.eligibilityError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
        {error}
      </div>
    );
  }

  if (!eligibilite) return null;

  const { est_eligible, criteres, motifs_ineligibilite, recommandation } = eligibilite;

  return (
    <div className={`
      p-4 rounded-lg border-2
      ${est_eligible ? 'border-success bg-success/5' : 'border-gray-200 bg-gray-50 dark:border-border-dark dark:bg-night-active'}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {est_eligible ? (
              <AppIcon icon={CheckCircleIcon} size="md" className="text-success" />
            ) : (
              <AppIcon icon={XCircleIcon} size="md" className="text-gray-400" />
            )}
            <h4 className="font-semibold text-gray-900 dark:text-slate-100">
              {est_eligible ? t('assets.eligibleForDisposal') : t('assets.notEligibleForDisposal')}
            </h4>
          </div>

          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
            {recommandation}
          </p>

          {/* Critères détaillés */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${criteres.garantie_expiree ? 'bg-success' : 'bg-gray-300'}`} />
              <span className="text-gray-600 dark:text-slate-400">
                {t('assets.criteriaWarrantyExpired')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${criteres.est_degrade ? 'bg-warning' : 'bg-gray-300'}`} />
              <span className="text-gray-600 dark:text-slate-400">
                {t('assets.criteriaDeteriorated')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${criteres.amortissement_termine ? 'bg-success' : 'bg-gray-300'}`} />
              <span className="text-gray-600 dark:text-slate-400">
                {t('assets.criteriaAmortized')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${criteres.cycles_techniques_obligatoires ? 'bg-success' : 'bg-gray-300'}`} />
              <span className="text-gray-600 dark:text-slate-400">
                {t('assets.criteriaTechCycle')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${criteres.pannes_consecutives >= 3 ? 'bg-danger' : 'bg-gray-300'}`} />
              <span className="text-gray-600 dark:text-slate-400">
                {t('assets.criteriaConsecutiveBreakdowns', { count: criteres.pannes_consecutives })}
              </span>
            </div>
          </div>

          {/* Motifs d'inéligibilité */}
          {!est_eligible && motifs_ineligibilite.length > 0 && (
            <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-xs font-medium text-warning">
                {t('assets.ineligibilityReasons')}:
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 dark:text-slate-400 mt-1">
                {motifs_ineligibilite.map((motif, idx) => (
                  <li key={idx}>{motif}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bouton Lancer cession */}
        {est_eligible && (
          <Button
            variant="success"
            size="sm"
            onClick={onCessionClick}
            className="shrink-0 ml-4"
          >
            <AppIcon icon={ArrowRightCircleIcon} size="sm" className="mr-1" />
            {t('assets.launchDisposal')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CessionEligibilitySection;