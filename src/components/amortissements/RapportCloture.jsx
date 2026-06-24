// frontend/src/components/amortissements/RapportCloture.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import { AppIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '../ui/icons';

const RapportCloture = ({ result, onClose, onViewEcritures }) => {
    const { t } = useTranslation();
    
    const hasErrors = result.erreurs?.length > 0;
    const isEmpty = !result.amortissements_crees?.length && !hasErrors;

    return (
        <div className="cloture-rapport">
            <div className="cloture-rapport-header">
                <h3 className="cloture-rapport-title">
                    <AppIcon icon={DocumentTextIcon} size="md" />
                    {t('amortissementsCloture.rapportTitle')}
                </h3>
                <div className="cloture-rapport-date">
                    {formatDate(result.date_execution)}
                </div>
            </div>

            <div className="cloture-rapport-stats">
                <div className="cloture-stat">
                    <span className="cloture-stat-value">{result.total_biens_traites}</span>
                    <span className="cloture-stat-label">{t('amortissementsCloture.biensTraites')}</span>
                </div>
                <div className="cloture-stat">
                    <span className="cloture-stat-value">{result.amortissements_crees?.length || 0}</span>
                    <span className="cloture-stat-label">{t('amortissementsCloture.amortCrees')}</span>
                </div>
                <div className="cloture-stat">
                    <span className="cloture-stat-value">{result.ecritures_dotations_generees || 0}</span>
                    <span className="cloture-stat-label">{t('amortissementsCloture.ecrituresDotations')}</span>
                </div>
                {hasErrors && (
                    <div className="cloture-stat error">
                        <span className="cloture-stat-value">{result.erreurs.length}</span>
                        <span className="cloture-stat-label">{t('amortissementsCloture.erreurs')}</span>
                    </div>
                )}
            </div>

            {/* Résumé par catégorie */}
            {result.resume_par_categorie && Object.keys(result.resume_par_categorie).length > 0 && (
                <div className="cloture-rapport-summary">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        {t('amortissementsCloture.resumeParCategorie')}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(result.resume_par_categorie).map(([categorie, data]) => (
                            <div key={categorie} className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                    {t(`categories.${categorie}`, categorie)}
                                </span>
                                <p className="text-sm font-medium">{data.count} biens - {formatPrice(data.total)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isEmpty && (
                <div className="cloture-rapport-empty">
                    <CheckCircleIcon className="w-16 h-16 text-blue-500 mx-auto" />
                    <h4 className="cloture-rapport-empty-title">
                        {t('amortissementsCloture.noAmortissementsCreated')}
                    </h4>
                    <p className="cloture-rapport-empty-desc">
                        {t('amortissementsCloture.noAmortissementsDesc')}
                    </p>
                </div>
            )}

            {!hasErrors && !isEmpty && (
                <div className="cloture-rapport-success">
                    <AppIcon icon={CheckCircleIcon} size="md" />
                    <span>{t('amortissementsCloture.successMessage')}</span>
                </div>
            )}

            {hasErrors && (
                <div className="cloture-rapport-errors">
                    <h4 className="cloture-rapport-errors-title">
                        <AppIcon icon={ExclamationTriangleIcon} size="sm" />
                        {t('amortissementsCloture.errorsList')}
                    </h4>
                    <ul className="cloture-rapport-errors-list">
                        {result.erreurs.map((err, idx) => (
                            <li key={idx}>
                                <span className="cloture-error-bien">{err.designation || `Bien #${err.bien_id}`}</span>
                                <span className="cloture-error-message">{err.erreur}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="cloture-rapport-actions">
                <button className="btn-primary" onClick={onClose}>
                    {t('common.close')}
                </button>
                {result.ecritures_dotations_generees > 0 && (
                    <button className="btn-secondary" onClick={onViewEcritures}>
                        <AppIcon icon={DocumentTextIcon} size="sm" />
                        {t('amortissementsCloture.voirEcritures')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RapportCloture;