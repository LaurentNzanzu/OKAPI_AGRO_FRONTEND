// frontend/src/components/amortissements/RepriseDepreciation.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { ecrituresService } from '../../services/ecritures_comptables';
import { formatPrice } from '../../utils/formatters';
import { AppIcon, XMarkIcon, ExclamationTriangleIcon } from '../ui/icons';

const RepriseDepreciation = ({ bienId, depreciation, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [montant, setMontant] = useState('');
    const [motif, setMotif] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const maxMontant = depreciation?.montant_depreciation || 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const montantValue = parseFloat(montant);
        if (isNaN(montantValue) || montantValue <= 0) {
            setError(t('amortissementsReprise.invalidMontant'));
            return;
        }
        if (montantValue > maxMontant) {
            setError(t('amortissementsReprise.montantDepasse', { max: formatPrice(maxMontant) }));
            return;
        }
        if (!motif.trim()) {
            setError(t('amortissementsReprise.motifRequired'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await ecrituresService.repriseDepreciation({
                bien_id: bienId,
                montant_reprise: montantValue,
                motif: motif.trim(),
                depreciation_id: depreciation?.id_amortissement
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Erreur reprise:', err);
            setError(err.response?.data?.detail || t('amortissementsReprise.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        {t('amortissementsReprise.title')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-300">
                        <AppIcon icon={XMarkIcon} size="md" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg mb-4 border border-red-200 dark:border-red-800 flex items-center gap-2">
                        <AppIcon icon={ExclamationTriangleIcon} size="sm" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            {t('amortissementsReprise.montantMax')}
                        </p>
                        <p className="text-lg font-bold text-primary-600">
                            {formatPrice(maxMontant)}
                        </p>
                    </div>

                    <div>
                        <label className="form-label">{t('amortissementsReprise.montantLabel')}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            className="form-input"
                            placeholder={t('amortissementsReprise.montantPlaceholder')}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">{t('amortissementsReprise.motifLabel')}</label>
                        <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            className="form-input"
                            rows="3"
                            placeholder={t('amortissementsReprise.motifPlaceholder')}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? t('common.loading') : t('amortissementsReprise.confirmer')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RepriseDepreciation;