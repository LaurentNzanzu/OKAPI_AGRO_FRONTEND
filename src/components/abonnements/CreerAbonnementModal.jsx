// frontend/src/components/abonnements/CreerAbonnementModal.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import abonnementsService from '../../services/abonnements';
import Button from '../common/Button';
import Input from '../common/Input';

const PLANS = ['BASIC', 'PRO', 'ENTERPRISE'];

const CreerAbonnementModal = ({ organisations = [], onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    organisation_id: organisations[0]?.id || '',
    plan: 'BASIC',
    duree_mois: 12,
    montant: 99,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.organisation_id) {
      setError('Organisation obligatoire');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await abonnementsService.create({
        organisation_id: parseInt(form.organisation_id),
        periode: new Date().toISOString().slice(0, 7),
        montant: parseFloat(form.montant) || 0,
        devise: 'USD',
        statut_paiement: 'EN_ATTENTE',
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
          {t('abonnements.renouveler')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Organisation
            </label>
            <select
              value={form.organisation_id}
              onChange={(e) => setForm({ ...form, organisation_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
            >
              <option value="">--</option>
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Plan
            </label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <Input
            type="number"
            label={t('abonnements.dureeMois')}
            value={form.duree_mois}
            onChange={(e) => setForm({ ...form, duree_mois: e.target.value })}
            min={1}
          />
          <Input
            type="number"
            label="Montant (USD)"
            value={form.montant}
            onChange={(e) => setForm({ ...form, montant: e.target.value })}
            min={0}
          />
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" isLoading={saving} onClick={handleSubmit}>
            {t('common.create')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreerAbonnementModal;