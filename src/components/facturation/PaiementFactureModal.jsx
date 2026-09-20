// frontend/src/components/facturation/PaiementFactureModal.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import facturationService from '../../services/facturation';
import Button from '../common/Button';
import Input from '../common/Input';

const PaiementFactureModal = ({ facture, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const now = new Date().toISOString().slice(0, 16);
  const [datePaiement, setDatePaiement] = useState(now);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await facturationService.enregistrerPaiement(facture.id, {
        date_paiement: datePaiement || null,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          {t('facturation.enregistrerPaiement')}
        </h3>
        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-night-active/40 text-sm">
          <p className="text-gray-600 dark:text-slate-300">
            Facture <span className="font-mono font-semibold">#{facture.id}</span> — {facture.periode}
          </p>
          <p className="text-gray-900 dark:text-slate-100 font-semibold mt-1">
            {parseFloat(facture.montant).toFixed(2)} {facture.devise}
          </p>
        </div>
        <Input
          label="Date de paiement"
          type="datetime-local"
          value={datePaiement}
          onChange={(e) => setDatePaiement(e.target.value)}
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="success" isLoading={saving} onClick={handleSubmit}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaiementFactureModal;