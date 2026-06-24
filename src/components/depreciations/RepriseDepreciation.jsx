import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { ecrituresService } from '../../services/ecritures_comptables';
import { formatPrice } from '../../utils/formatters';

/**
 * Formulaire de reprise de dépréciation (écriture 2944 / 7914).
 */
const RepriseDepreciation = ({
  bienId,
  cumulDepreciation,
  depreciationId = null,
  maxMontant = null,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [montant, setMontant] = useState(maxMontant ? String(maxMontant) : '');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const plafond = maxMontant != null ? Math.min(maxMontant, cumulDepreciation) : cumulDepreciation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const montantNum = parseFloat(montant);
    if (!montantNum || montantNum <= 0) {
      setError(t('depreciations.reprise.errorAmountPositive'));
      return;
    }
    if (montantNum > plafond) {
      setError(t('depreciations.reprise.errorAmountMax', { max: plafond }));
      return;
    }
    if (!motif || motif.trim().length < 3) {
      setError(t('depreciations.reprise.errorMotif'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await ecrituresService.repriseDepreciation({
        bien_id: Number(bienId),
        montant_reprise: montantNum,
        motif: motif.trim(),
        depreciation_id: depreciationId,
      });
      alert(
        t('depreciations.reprise.success', {
          debit: result.ecriture?.compte_debit,
          credit: result.ecriture?.compte_credit,
          cumul: result.nouveau_cumul_depreciation,
        })
      );
      onSuccess?.(result);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || t('depreciations.reprise.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-card p-4 border border-primary-200 bg-primary-50/30 dark:bg-primary-900/10">
      <h4 className="font-semibold mb-2">{t('depreciations.reprise.title')}</h4>
      <p className="text-xs text-gray-500 mb-3">
        {t('depreciations.history.ohadaHint', { amount: formatPrice(plafond) })}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="form-label">{t('depreciations.reprise.amountLabel')}</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={plafond}
            className="form-input w-full"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="form-label">{t('depreciations.reprise.motifLabel')}</label>
          <textarea
            className="form-input w-full"
            rows={2}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={t('depreciations.reprise.motifPlaceholder')}
            required
            minLength={3}
          />
        </div>
        {error && <div className="alert-error text-sm">{error}</div>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('depreciations.reprise.confirmBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RepriseDepreciation;
