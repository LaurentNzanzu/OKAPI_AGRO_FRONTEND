// frontend/src/components/projets/NouveauProjet.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import projetsService from '../../services/projets';
import AppPage from '../common/AppPage';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { ArrowLeftIcon, FolderOpenIcon } from '../common/icons';

const NouveauProjet = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isPlatformAdmin = !user?.organisation_id;

  const [form, setForm] = useState({
    organisation_id: user?.organisation_id || '',
    code: '',
    nom: '',
    bailleur: '',
    budget_annuel: 0,
    devise: 'USD',
    date_debut: '',
    date_fin: '',
    est_actif: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        organisation_id: parseInt(form.organisation_id),
        code: form.code.trim().toUpperCase(),
        nom: form.nom.trim(),
        bailleur: form.bailleur || null,
        budget_annuel: parseFloat(form.budget_annuel) || 0,
        devise: form.devise.toUpperCase(),
        est_actif: !!form.est_actif,
      };
      if (form.date_debut) payload.date_debut = form.date_debut;
      if (form.date_fin) payload.date_fin = form.date_fin;

      const created = await projetsService.create(payload);
      navigate(`/projets/${created.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppPage>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/projets')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-night-active text-gray-500 dark:text-slate-300"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
          <FolderOpenIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-slate-100">
            {t('projets.new')}
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
            {t('projets.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title={t('projets.infoGenerales')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isPlatformAdmin && (
              <Input
                label="ID organisation"
                type="number"
                value={form.organisation_id}
                onChange={(e) => setForm({ ...form, organisation_id: e.target.value })}
                required
              />
            )}
            <Input
              label={t('projets.code')}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder={t('projets.codeHelp')}
              required
              minLength={2}
              maxLength={50}
            />
            <Input
              label={t('projets.nom')}
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
              minLength={2}
            />
            <Input
              label={t('projets.bailleur')}
              value={form.bailleur}
              onChange={(e) => setForm({ ...form, bailleur: e.target.value })}
            />
            <Input
              label={t('projets.budgetAnnuelLabel')}
              type="number"
              step="0.01"
              value={form.budget_annuel}
              onChange={(e) => setForm({ ...form, budget_annuel: e.target.value })}
              min={0}
            />
            <Input
              label={t('projets.devise')}
              value={form.devise}
              onChange={(e) => setForm({ ...form, devise: e.target.value.toUpperCase() })}
              maxLength={3}
            />
            <Input
              label={t('projets.dateDebut')}
              type="date"
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
            />
            <Input
              label={t('projets.dateFin')}
              type="date"
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            />
            <label className="flex items-center gap-2 mt-1 text-sm text-gray-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={!!form.est_actif}
                onChange={(e) => setForm({ ...form, est_actif: e.target.checked })}
              />
              {t('projets.estActif')}
            </label>
          </div>
        </Card>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate('/projets')}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" isLoading={saving}>
            {t('common.create')}
          </Button>
        </div>
      </form>
    </AppPage>
  );
};

export default NouveauProjet;