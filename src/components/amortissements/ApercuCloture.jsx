// frontend/src/components/amortissements/ApercuCloture.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { formatPrice } from '../../utils/formatters';
import { AppIcon, XMarkIcon, CheckCircleIcon } from '../ui/icons';

const ApercuCloture = ({ biens, onToggleAll, onToggleBien, selectedIds, onClose }) => {
    const { t } = useTranslation();
    
    const allSelected = biens.every(b => selectedIds.includes(b.id_bien));
    const someSelected = biens.some(b => selectedIds.includes(b.id_bien));

    const totalMontant = biens
        .filter(b => selectedIds.includes(b.id_bien) && b.est_eligible)
        .reduce((sum, b) => sum + b.montant_estime, 0);

    return (
        <div className="apercu-biens-modal">
            <div className="apercu-biens-content">
                <div className="apercu-biens-header">
                    <h3 className="apercu-biens-title">
                        <AppIcon icon={CheckCircleIcon} size="md" />
                        {t('amortissementsCloture.previewTitle')}
                    </h3>
                    <button className="apercu-biens-close" onClick={onClose}>
                        <AppIcon icon={XMarkIcon} size="md" />
                    </button>
                </div>

                <div className="apercu-biens-actions">
                    <label className="apercu-toggle-all">
                        <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                                if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={onToggleAll}
                        />
                        <span>{t('amortissementsCloture.selectAll', { count: biens.length })}</span>
                    </label>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                        {t('amortissementsCloture.totalMontant', {
                            amount: formatPrice(totalMontant)
                        })}
                    </span>
                </div>
            
                <div className="apercu-biens-list">
                    {biens.map((bien) => (
                        <div key={bien.id_bien} className="apercu-bien-item">
                            <label className="apercu-bien-check">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(bien.id_bien)}
                                    onChange={() => onToggleBien(bien.id_bien)}
                                    disabled={!bien.est_eligible}
                                />
                            </label>
                            <div className="apercu-bien-info">
                                <span className="apercu-bien-nom">{bien.designation}</span>
                                <span className="apercu-bien-categorie">
                                    {t(`categories.${bien.categorie}`, bien.categorie)}
                                </span>
                                <span className="apercu-bien-statut">
                                    {bien.statut_comptable}
                                </span>
                            </div>
                            <div className="apercu-bien-methode">
                                {bien.methode_actuelle}
                            </div>
                            <div className="apercu-bien-montant">
                                {formatPrice(bien.montant_estime)}
                            </div>
                            {!bien.est_eligible && (
                                <div className="apercu-bien-error" title={bien.raison_non_eligibilite}>
                                    <AppIcon icon={ExclamationTriangleIcon} size="xs" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            
                <div className="apercu-biens-footer">
                    <div className="apercu-biens-stats">
                        <span>{t('amortissementsCloture.totalBiens', { count: biens.length })}</span>
                        <span>{t('amortissementsCloture.biensEligibles', {
                            count: biens.filter(b => b.est_eligible).length,
                            total: biens.length
                        })}</span>
                    </div>
                    <button className="btn-primary" onClick={onClose}>
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApercuCloture;