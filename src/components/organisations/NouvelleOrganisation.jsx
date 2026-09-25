// frontend/src/components/organisations/NouvelleOrganisation.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import organisationsService from '../../services/organisations';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ArrowLeftIcon, BuildingOffice2Icon } from '../ui/icons';

const PLANS = ['BASIC', 'PRO', 'ENTERPRISE'];

const QUOTAS_DEFAUT = {
  BASIC: { vehicules: 5, chauffeurs: 10, missions: 50 },
  PRO: { vehicules: 50, chauffeurs: 100, missions: 500 },
  ENTERPRISE: {
    vehicules: 999999,
    chauffeurs: 999999,
    missions: 999999,
  },
};

const NouvelleOrganisation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    nom: '',
    code: '',
    email_admin: '',
    plan_abonnement: 'BASIC',
    quota_vehicules: QUOTAS_DEFAUT.BASIC.vehicules,
    quota_chauffeurs: QUOTAS_DEFAUT.BASIC.chauffeurs,
    quota_missions_mois: QUOTAS_DEFAUT.BASIC.missions,
    devise: 'USD',
    date_debut: '',
    date_fin: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handlePlanChange = (plan) => {
    const q = QUOTAS_DEFAUT[plan];

    setForm((prev) => ({
      ...prev,
      plan_abonnement: plan,
      quota_vehicules: q.vehicules,
      quota_chauffeurs: q.chauffeurs,
      quota_missions_mois: q.missions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        nom: form.nom.trim(),
        code: form.code.trim().toUpperCase(),
        email_admin: form.email_admin.trim(),
        plan_abonnement: form.plan_abonnement,
        quota_vehicules: parseInt(form.quota_vehicules) || 0,
        quota_chauffeurs: parseInt(form.quota_chauffeurs) || 0,
        quota_missions_mois: parseInt(form.quota_missions_mois) || 0,
        devise: form.devise.toUpperCase(),
      };

      if (form.date_debut) {
        payload.date_debut = form.date_debut;
      }

      if (form.date_fin) {
        payload.date_fin = form.date_fin;
      }

      const created = await organisationsService.create(payload);

      // Les identifiants temporaires sont transmis uniquement
      // à la fiche ouverte juste après la création.
      navigate(`/organisations/${created.id}`, {
        state: {
          newOrganisationCredentials: {
            email: created.admin_email,
            temporaryPassword:
              created.admin_mot_de_passe_temporaire,
            mustChangePassword:
              created.admin_doit_changer_mdp,
          },
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          t('organisations.deleteError')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppPage>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/organisations')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-night-active text-gray-500 dark:text-slate-300"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
          <BuildingOffice2Icon className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-page-title text-gray-900 dark:text-slate-100">
            {t('organisations.new')}
          </h1>

          <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
            {t('organisations.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title={t('organisations.infoGenerales')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('organisations.colNom')}
              value={form.nom}
              onChange={(e) =>
                setForm({ ...form, nom: e.target.value })
              }
              required
              minLength={2}
            />

            <Input
              label={t('organisations.colCode')}
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase(),
                })
              }
              placeholder={t('organisations.codeHelp')}
              required
              minLength={2}
            />

            <Input
              label={t('organisations.colEmail')}
              type="email"
              value={form.email_admin}
              onChange={(e) =>
                setForm({
                  ...form,
                  email_admin: e.target.value,
                })
              }
              required
            />

            <Input
              label={t('organisations.devise')}
              value={form.devise}
              onChange={(e) =>
                setForm({
                  ...form,
                  devise: e.target.value.toUpperCase(),
                })
              }
              maxLength={3}
              required
            />

            <Input
              label={t('organisations.dateDebut')}
              type="date"
              value={form.date_debut}
              onChange={(e) =>
                setForm({
                  ...form,
                  date_debut: e.target.value,
                })
              }
            />

            <Input
              label={t('organisations.dateFin')}
              type="date"
              value={form.date_fin}
              onChange={(e) =>
                setForm({
                  ...form,
                  date_fin: e.target.value,
                })
              }
            />
          </div>
        </Card>

        <Card
          title={t('organisations.colPlan')}
          className="mt-6"
        >
          <div className="flex flex-wrap gap-3 mb-5">
            {PLANS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePlanChange(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.plan_abonnement === p
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-slate-300 border-border-light dark:border-border-dark hover:border-primary-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            {t('organisations.planHelp')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t('organisations.quotaVehicules')}
              type="number"
              value={form.quota_vehicules}
              onChange={(e) =>
                setForm({
                  ...form,
                  quota_vehicules: e.target.value,
                })
              }
              min={0}
            />

            <Input
              label={t('organisations.quotaChauffeurs')}
              type="number"
              value={form.quota_chauffeurs}
              onChange={(e) =>
                setForm({
                  ...form,
                  quota_chauffeurs: e.target.value,
                })
              }
              min={0}
            />

            <Input
              label={t('organisations.quotaMissions')}
              type="number"
              value={form.quota_missions_mois}
              onChange={(e) =>
                setForm({
                  ...form,
                  quota_missions_mois: e.target.value,
                })
              }
              min={0}
            />
          </div>
        </Card>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/organisations')}
          >
            {t('common.cancel')}
          </Button>

          <Button
            variant="primary"
            type="submit"
            isLoading={saving}
          >
            {t('common.create')}
          </Button>
        </div>
      </form>
    </AppPage>
  );
};

export default NouvelleOrganisation;