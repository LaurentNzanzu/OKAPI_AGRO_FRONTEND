// frontend/src/components/projets/FicheProjet.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppPage from '../common/AppPage';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import PageLoader from '../common/PageLoader';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  FolderOpenIcon,
} from '../common/icons';

const FicheProjet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [projet, setProjet] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  const isNew = id === 'nouveau';
  const canGerer = hasPermission('projet.gerer');

  const fetchData = async () => {
    if (isNew) {
      setLoading(false);
      setFormData({
        organisation_id: 1,
        code: '',
        nom: '',
        bailleur: '',
        budget_annuel: 0,
        devise: 'USD',
        date_debut: '',
        date_fin: '',
        est_actif: true,
      });
      setEditing(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/projets/${id}/`);
      setProjet(data);
      setFormData({
        code: data.code,
        nom: data.nom,
        bailleur: data.bailleur || '',
        budget_annuel: data.budget_annuel,
        devise: data.devise,
        date_debut: data.date_debut || '',
        date_fin: data.date_fin || '',
        est_actif: data.est_actif,
      });
      try {
        const { data: b } = await api.get(`/projets/${id}/budget/`);
        setBudget(b);
      } catch {
        setBudget(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('projets.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        nom: formData.nom.trim(),
        bailleur: formData.bailleur || null,
        budget_annuel: parseFloat(formData.budget_annuel) || 0,
        devise: (formData.devise || 'USD').toUpperCase(),
        est_actif: !!formData.est_actif,
      };
      if (formData.date_debut) payload.date_debut = formData.date_debut;
      if (formData.date_fin) payload.date_fin = formData.date_fin;

      if (isNew) {
        payload.organisation_id = formData.organisation_id;
        const { data } = await api.post('/projets/', payload);
        navigate(`/projets/${data.id}`);
      } else {
        await api.put(`/projets/${id}/`, payload);
        setEditing(false);
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || t('projets.loadError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDesactiver = async () => {
    if (!window.confirm(t('projets.desactiverConfirm'))) return;
    try {
      await api.delete(`/projets/${id}/`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || t('projets.loadError'));
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <AppPage><div className="p-4 rounded-lg bg-danger/10 text-danger">{error}</div></AppPage>;

  return (
    <AppPage>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
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
              {isNew ? t('projets.new') : projet?.nom}
            </h1>
            {!isNew && (
              <p className="text-page-subtitle text-gray-500 dark:text-slate-400 font-mono">
                {projet?.code}
              </p>
            )}
          </div>
        </div>
        {canGerer && !isNew && !editing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilSquareIcon className="w-4 h-4" /> {t('common.edit')}
            </Button>
            {projet?.est_actif && (
              <Button variant="danger" onClick={handleDesactiver}>
                <TrashIcon className="w-4 h-4" /> {t('projets.desactiver')}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={t('projets.infoGenerales')}
          className="lg:col-span-2"
          actions={
            editing && (
              <div className="flex gap-2">
                {!isNew && <Button variant="ghost" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>}
                <Button variant="primary" isLoading={saving} onClick={handleSave}>
                  {t('common.save')}
                </Button>
              </div>
            )
          }
        >
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isNew && (
                <Input
                  label="organisation_id"
                  type="number"
                  value={formData.organisation_id || ''}
                  onChange={(e) => setFormData({ ...formData, organisation_id: parseInt(e.target.value) || 0 })}
                />
              )}
              <Input
                label={t('projets.code')}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={t('projets.codeHelp')}
              />
              <Input
                label={t('projets.nom')}
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
              <Input
                label={t('projets.bailleur')}
                value={formData.bailleur}
                onChange={(e) => setFormData({ ...formData, bailleur: e.target.value })}
              />
              <Input
                label={t('projets.budgetAnnuelLabel')}
                type="number"
                value={formData.budget_annuel}
                onChange={(e) => setFormData({ ...formData, budget_annuel: e.target.value })}
              />
              <Input
                label={t('projets.devise')}
                maxLength={3}
                value={formData.devise}
                onChange={(e) => setFormData({ ...formData, devise: e.target.value.toUpperCase() })}
              />
              <Input
                label={t('projets.dateDebut')}
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              />
              <Input
                label={t('projets.dateFin')}
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              />
              <label className="flex items-center gap-2 mt-1 text-sm">
                <input
                  type="checkbox"
                  checked={!!formData.est_actif}
                  onChange={(e) => setFormData({ ...formData, est_actif: e.target.checked })}
                  className="rounded border-border-light dark:border-border-dark"
                />
                {t('projets.estActif')}
              </label>
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Row label={t('projets.code')} value={projet.code} />
              <Row label={t('projets.nom')} value={projet.nom} />
              <Row label={t('projets.bailleur')} value={projet.bailleur || '—'} />
              <Row label={t('projets.devise')} value={projet.devise} />
              <Row label={t('projets.dateDebut')} value={projet.date_debut || '—'} />
              <Row label={t('projets.dateFin')} value={projet.date_fin || '—'} />
              <Row
                label={t('projets.colStatut')}
                value={projet.est_actif ? t('projets.statutActif') : t('projets.statutInactif')}
              />
            </dl>
          )}
        </Card>

        {!isNew && budget && (
          <Card title={t('projets.budgetTitle')}>
            <div className="space-y-4">
              <BudgetRow label={t('projets.budgetAnnuel')} value={`${parseFloat(budget.budget_annuel).toFixed(2)} ${budget.devise}`} />
              <BudgetRow label={t('projets.budgetConsomme')} value={`${parseFloat(budget.budget_consomme).toFixed(2)} ${budget.devise}`} />
              <BudgetRow label={t('projets.budgetRestant')} value={`${parseFloat(budget.budget_restant).toFixed(2)} ${budget.devise}`} />
              <div className="pt-3 border-t border-border-light dark:border-border-dark">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500 dark:text-slate-400">{t('projets.tauxUtilisation')}</span>
                  <span className="font-semibold">{budget.taux_utilisation?.toFixed(2)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-night-muted overflow-hidden">
                  <div
                    className={`h-full ${budget.est_depasse ? 'bg-danger' : budget.est_en_alerte ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${Math.min(100, budget.taux_utilisation || 0)}%` }}
                  />
                </div>
                {budget.est_depasse && (
                  <p className="mt-2 text-xs text-danger">{t('projets.budgetDepasse')}</p>
                )}
                {!budget.est_depasse && budget.est_en_alerte && (
                  <p className="mt-2 text-xs text-warning">{t('projets.budgetAlerte')}</p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppPage>
  );
};

const Row = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</dt>
    <dd className="mt-1 font-medium text-gray-900 dark:text-slate-100">{value}</dd>
  </div>
);

const BudgetRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-600 dark:text-slate-300">{label}</span>
    <span className="font-semibold text-gray-900 dark:text-slate-100">{value}</span>
  </div>
);

export default FicheProjet;