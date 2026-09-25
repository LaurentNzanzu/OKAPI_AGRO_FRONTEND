// frontend/src/components/organisations/FicheOrganisation.jsx
import React, { useEffect, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PageLoader from '../common/PageLoader';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
} from '../ui/icons';

const PLANS = ['BASIC', 'PRO', 'ENTERPRISE'];

const FicheOrganisation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  // Identifiants disponibles uniquement après la création
  // de l'organisation.
  const credentials =
    location.state?.newOrganisationCredentials || null;

  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [motif, setMotif] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  const canGerer = hasPermission('organisation.gerer');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get(
        `/organisations/${id}/`
      );

      setOrganisation(data);

      setFormData({
        nom: data.nom,
        email_admin: data.email_admin,
        plan_abonnement: data.plan_abonnement,
        quota_vehicules: data.quota_vehicules,
        quota_chauffeurs: data.quota_chauffeurs,
        quota_missions_mois: data.quota_missions_mois,
        devise: data.devise,
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          t('organisations.loadError')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCopy = async (value, field) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);

      setCopiedField(field);

      window.setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    } catch (err) {
      console.error(
        'Impossible de copier dans le presse-papiers :',
        err
      );
    }
  };

  const handleCopyAllCredentials = async () => {
    if (!credentials) return;

    const text = [
      `Email : ${credentials.email}`,
      `Mot de passe temporaire : ${credentials.temporaryPassword}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);

      setCopiedField('all');

      window.setTimeout(() => {
        setCopiedField(null);
      }, 1500);
    } catch (err) {
      console.error(
        'Impossible de copier les identifiants :',
        err
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = { ...formData };

      if (!payload.date_debut) {
        delete payload.date_debut;
      }

      if (!payload.date_fin) {
        delete payload.date_fin;
      }

      await api.put(`/organisations/${id}/`, payload);

      setEditing(false);

      await fetchData();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          t('organisations.deleteError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendre = async () => {
    if (!motif.trim()) return;

    try {
      await api.post(
        `/organisations/${id}/suspendre/`,
        {
          motif: motif.trim(),
        }
      );

      setSuspendModal(false);
      setMotif('');

      await fetchData();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          t('organisations.deleteError')
      );
    }
  };

  const handleReactiver = async () => {
    if (
      !window.confirm(
        t('organisations.reactiverConfirm')
      )
    ) {
      return;
    }

    try {
      await api.post(
        `/organisations/${id}/reactiver/`
      );

      await fetchData();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          t('organisations.deleteError')
      );
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <AppPage>
        <div className="p-4 rounded-lg bg-danger/10 text-danger">
          {error}
        </div>
      </AppPage>
    );
  }

  if (!organisation) {
    return null;
  }

  const statutColor =
    organisation.statut === 'ACTIF'
      ? 'text-success'
      : organisation.statut === 'SUSPENDU'
        ? 'text-warning'
        : 'text-danger';

  return (
    <AppPage>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/organisations')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-night-active text-gray-500 dark:text-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
            <BuildingOffice2Icon className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-page-title text-gray-900 dark:text-slate-100">
              {organisation.nom}
            </h1>

            <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
              <span className="font-mono font-semibold">
                {organisation.code}
              </span>{' '}
              •{' '}
              <span className={statutColor}>
                {t(
                  `organisations.statut${
                    organisation.statut.charAt(0) +
                    organisation.statut
                      .slice(1)
                      .toLowerCase()
                  }`
                )}
              </span>
            </p>
          </div>
        </div>

        {canGerer && (
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  {t('common.edit')}
                </Button>

                {organisation.statut === 'ACTIF' ? (
                  <Button
                    variant="danger"
                    onClick={() =>
                      setSuspendModal(true)
                    }
                  >
                    <NoSymbolIcon className="w-4 h-4" />
                    {t('organisations.suspendre')}
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={handleReactiver}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {t('organisations.reactiver')}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  {t('common.cancel')}
                </Button>

                <Button
                  variant="primary"
                  isLoading={saving}
                  onClick={handleSave}
                >
                  {t('common.save')}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={t('organisations.infoGenerales')}
          className="lg:col-span-2"
        >
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('organisations.colNom')}
                value={formData.nom || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nom: e.target.value,
                  })
                }
              />

              <Input
                label={t('organisations.colEmail')}
                type="email"
                value={formData.email_admin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email_admin: e.target.value,
                  })
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {t('organisations.colPlan')}
                </label>

                <select
                  value={
                    formData.plan_abonnement || 'BASIC'
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plan_abonnement: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={t('organisations.devise')}
                value={formData.devise || 'USD'}
                maxLength={3}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    devise:
                      e.target.value.toUpperCase(),
                  })
                }
              />

              <Input
                label={t(
                  'organisations.quotaVehicules'
                )}
                type="number"
                value={
                  formData.quota_vehicules || 0
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quota_vehicules:
                      parseInt(e.target.value) || 0,
                  })
                }
              />

              <Input
                label={t(
                  'organisations.quotaChauffeurs'
                )}
                type="number"
                value={
                  formData.quota_chauffeurs || 0
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quota_chauffeurs:
                      parseInt(e.target.value) || 0,
                  })
                }
              />

              <Input
                label={t(
                  'organisations.quotaMissions'
                )}
                type="number"
                value={
                  formData.quota_missions_mois || 0
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quota_missions_mois:
                      parseInt(e.target.value) || 0,
                  })
                }
              />

              <Input
                label={t('organisations.dateDebut')}
                type="date"
                value={formData.date_debut || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date_debut: e.target.value,
                  })
                }
              />

              <Input
                label={t('organisations.dateFin')}
                type="date"
                value={formData.date_fin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date_fin: e.target.value,
                  })
                }
              />
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <InfoRow
                label={t('organisations.colNom')}
                value={organisation.nom}
              />

              <InfoRow
                label={t('organisations.colEmail')}
                value={organisation.email_admin}
              />

              <InfoRow
                label={t('organisations.colPlan')}
                value={organisation.plan_abonnement}
              />

              <InfoRow
                label={t('organisations.devise')}
                value={organisation.devise}
              />

              <InfoRow
                label={t('organisations.dateDebut')}
                value={
                  organisation.date_debut || '—'
                }
              />

              <InfoRow
                label={t('organisations.dateFin')}
                value={organisation.date_fin || '—'}
              />
            </dl>
          )}
        </Card>

        <Card title={t('organisations.quotas')}>
          <div className="space-y-4">
            <QuotaRow
              label={t(
                'organisations.quotaVehicules'
              )}
              value={organisation.quota_vehicules}
            />

            <QuotaRow
              label={t(
                'organisations.quotaChauffeurs'
              )}
              value={
                organisation.quota_chauffeurs
              }
            />

            <QuotaRow
              label={t(
                'organisations.quotaMissions'
              )}
              value={
                organisation.quota_missions_mois
              }
            />
          </div>
        </Card>
      </div>

      {/* Identifiants de première connexion.
          Cette section n'apparaît que juste après la création. */}
      {credentials && (
        <Card
          title="Accès administrateur"
          className="mt-6"
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-warning">
                  ⚠
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    Identifiants de première connexion
                  </p>

                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                    Ces identifiants ont été générés
                    pour l'administrateur de
                    l'organisation. Le mot de passe est
                    temporaire et devra être modifié
                    lors de la première connexion.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1.5">
                  Email administrateur
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-night-active text-sm font-medium text-gray-900 dark:text-slate-100 break-all">
                    {credentials.email}
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      handleCopy(
                        credentials.email,
                        'email'
                      )
                    }
                  >
                    {copiedField === 'email'
                      ? '✓ Copié'
                      : 'Copier'}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1.5">
                  Mot de passe temporaire
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-night-active font-mono font-semibold text-sm text-gray-900 dark:text-slate-100 break-all">
                    {credentials.temporaryPassword}
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      handleCopy(
                        credentials.temporaryPassword,
                        'password'
                      )
                    }
                  >
                    {copiedField === 'password'
                      ? '✓ Copié'
                      : 'Copier'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              {credentials.mustChangePassword ? (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Pour des raisons de sécurité,
                  l'administrateur devra choisir un
                  nouveau mot de passe lors de sa
                  première connexion.
                </p>
              ) : (
                <div />
              )}

              <Button
                variant="outline"
                type="button"
                onClick={handleCopyAllCredentials}
              >
                {copiedField === 'all'
                  ? '✓ Identifiants copiés'
                  : 'Copier les identifiants'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-xl shadow-dropdown border border-border-light dark:border-border-dark p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
              {t('organisations.suspendreTitle')}
            </h3>

            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              {t('organisations.suspendreMotif')}
            </label>

            <textarea
              rows={3}
              value={motif}
              onChange={(e) =>
                setMotif(e.target.value)
              }
              placeholder={t(
                'organisations.suspendreMotifPlaceholder'
              )}
              className="w-full px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            />

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  setSuspendModal(false)
                }
              >
                {t('common.cancel')}
              </Button>

              <Button
                variant="danger"
                disabled={!motif.trim()}
                onClick={handleSuspendre}
              >
                {t(
                  'organisations.suspendreConfirm'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
      {label}
    </dt>

    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">
      {value}
    </dd>
  </div>
);

const QuotaRow = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600 dark:text-slate-300">
      {label}
    </span>

    <span className="text-base font-semibold text-primary-600 dark:text-primary-200">
      {value}
    </span>
  </div>
);

export default FicheOrganisation;