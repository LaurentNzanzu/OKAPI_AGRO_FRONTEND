// frontend/src/components/abonnements/GestionAbonnements.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isPlatformAdmin } from '../../config/permissions';
import api from '../../services/api';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PageLoader from '../common/PageLoader';
import {
  CreditCardIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '../ui/icons';

const GestionAbonnements = () => {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const isPlatform = isPlatformAdmin(user);

  const [organisationId, setOrganisationId] = useState(user?.organisation_id || '');
  const [organisations, setOrganisations] = useState([]);
  const [abonnement, setAbonnement] = useState(null);
  const [quotas, setQuotas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [renewModal, setRenewModal] = useState(false);
  const [dureeMois, setDureeMois] = useState(12);

   useEffect(() => {
    const loadOrgs = async () => {
      // ═══ AJOUT 5.23-bis — Seul l'ADMIN plateforme charge la liste complète ═══
      if (!isPlatform) return;
      try {
        const { data } = await api.get('/organisations/');
        setOrganisations(Array.isArray(data) ? data : []);
      } catch {
        // silencieux
      }
    };
    loadOrgs();
  }, [isPlatform]);

  const fetchData = useCallback(async () => {
    if (!organisationId) return;
    setLoading(true);
    setError(null);
    try {
      const [aboRes, quotaRes] = await Promise.all([
        api.get(`/abonnements/${organisationId}`),
        api.get(`/abonnements/${organisationId}/quotas`),
      ]);
      setAbonnement(aboRes.data);
      setQuotas(quotaRes.data);
    } catch (err) {
      setError(err.response?.data?.message || t('abonnements.loadError'));
    } finally {
      setLoading(false);
    }
  }, [organisationId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRenouveler = async () => {
    try {
      await api.post(`/abonnements/${organisationId}/renouveler`, { duree_mois: dureeMois });
      setRenewModal(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || t('abonnements.loadError'));
    }
  };

  const renderQuota = (label, quota) => {
    if (!quota) return null;
    const used = quota.utilise ?? 0;
    const max = quota.quota ?? 0;
    const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
    const saturate = pct >= 100;
    const attention = pct >= 80 && pct < 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-slate-300">{label}</span>
          <span className={`font-medium ${saturate ? 'text-danger' : attention ? 'text-warning' : 'text-gray-900 dark:text-slate-100'}`}>
            {used} / {max}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-night-muted overflow-hidden">
          <div
            className={`h-full transition-all ${saturate ? 'bg-danger' : attention ? 'bg-warning' : 'bg-success'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {saturate && (
          <p className="text-xs text-danger">{t('abonnements.quotaSature')}</p>
        )}
        {attention && (
          <p className="text-xs text-warning">{t('abonnements.quotaAttention')}</p>
        )}
      </div>
    );
  };

  return (
    <AppPage>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
          <CreditCardIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-slate-100">
            {t('abonnements.title')}
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
            {t('abonnements.subtitle')}
          </p>
        </div>
      </div>

      {isPlatform && organisations.length > 0 && (
        <Card compact className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            {t('abonnements.selectOrg')}
          </label>
          <select
            value={organisationId}
            onChange={(e) => setOrganisationId(e.target.value)}
            className="w-full md:w-96 px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
          >
            <option value="">--</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} — {o.nom}
              </option>
            ))}
          </select>
        </Card>
      )}

     {!organisationId && isPlatform && (
        <Card>
          <p className="text-center py-10 text-sm text-gray-500 dark:text-slate-400">
            {t('abonnements.selectOrg')}
          </p>
        </Card>
      )}

      {loading && <PageLoader />}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
          {error}
        </div>
      )}

      {abonnement && quotas && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title={t('abonnements.overview')}
            actions={
              hasPermission('abonnement.gerer') && (
                <Button size="sm" variant="outline" onClick={() => setRenewModal(true)}>
                  <ArrowPathIcon className="w-4 h-4" />
                  {t('abonnements.renouveler')}
                </Button>
              )
            }
          >
            <dl className="space-y-3 text-sm">
              <Row label={t('abonnements.plan')} value={abonnement.plan_abonnement} />
              <Row label={t('abonnements.statut')} value={
                abonnement.est_actif ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircleIcon className="w-4 h-4" /> {t('organisations.statutActif')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-danger">
                    <ExclamationTriangleIcon className="w-4 h-4" /> {abonnement.statut_organisation}
                  </span>
                )
              } />
              <Row label={t('abonnements.dates')} value={`${abonnement.date_debut || '—'} → ${abonnement.date_fin || '—'}`} />
            </dl>
          </Card>

          <Card title={t('abonnements.facturation')}>
            <dl className="space-y-3 text-sm">
              <Row label={t('abonnements.totalFacture')} value={fmt(abonnement.facturation?.total_facture)} />
              <Row label={t('abonnements.totalPaye')} value={fmt(abonnement.facturation?.total_paye)} />
              <Row label={t('abonnements.totalImpaye')} value={fmt(abonnement.facturation?.total_impaye)} />
              <Row label={t('abonnements.facturesImpayees')} value={abonnement.facturation?.nb_factures_impayees ?? 0} />
            </dl>
          </Card>

          <Card title={t('abonnements.quotasTitle')} className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderQuota(t('organisations.quotaVehicules'), quotas.vehicules)}
              {renderQuota(t('organisations.quotaChauffeurs'), quotas.chauffeurs)}
              {renderQuota(t('organisations.quotaMissions'), quotas.missions_mois)}
            </div>
          </Card>
        </div>
      )}

      {renewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              {t('abonnements.renouveler')}
            </h3>
            <Input
              type="number"
              label={t('abonnements.dureeMois')}
              value={dureeMois}
              onChange={(e) => setDureeMois(parseInt(e.target.value) || 12)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRenewModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleRenouveler}>
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <dt className="text-gray-500 dark:text-slate-400">{label}</dt>
    <dd className="font-medium text-gray-900 dark:text-slate-100">{value}</dd>
  </div>
);

const fmt = (v) => {
  const n = parseFloat(v || 0);
  return `${n.toFixed(2)} USD`;
};

export default GestionAbonnements;