// frontend/src/components/workflow/GestionWorkflow.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppPage from '../common/AppPage';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import PageLoader from '../common/PageLoader';
import {
  AdjustmentsHorizontalIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../common/icons';

const TYPES_WORKFLOW = ['MISSION', 'RAVITAILLEMENT', 'INCIDENT'];

const GestionWorkflow = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [typeWorkflow, setTypeWorkflow] = useState('MISSION');
  const [etapes, setEtapes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEtape, setEditingEtape] = useState(null);
  const [formData, setFormData] = useState({
    ordre: 1,
    role_requis: '',
    permission_requise: '',
    condition: '',
    est_optionnelle: false,
    actif: true,
  });
  const [saving, setSaving] = useState(false);

  const canGerer = hasPermission('workflow.gerer');

  const fetchEtapes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/workflow/${typeWorkflow}/`);
      setEtapes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || t('workflow.loadError'));
    } finally {
      setLoading(false);
    }
  }, [typeWorkflow, t]);

  useEffect(() => {
    fetchEtapes();
  }, [fetchEtapes]);

  const openCreate = () => {
    setEditingEtape(null);
    setFormData({
      ordre: etapes.length + 1,
      role_requis: '',
      permission_requise: '',
      condition: '',
      est_optionnelle: false,
      actif: true,
    });
    setModalOpen(true);
  };

  const openEdit = (etape) => {
    setEditingEtape(etape);
    setFormData({
      ordre: etape.ordre,
      role_requis: etape.role_requis || '',
      permission_requise: etape.permission_requise || '',
      condition: etape.condition ? JSON.stringify(etape.condition) : '',
      est_optionnelle: !!etape.est_optionnelle,
      actif: !!etape.actif,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let conditionObj = null;
      if (formData.condition && formData.condition.trim()) {
        try {
          conditionObj = JSON.parse(formData.condition);
        } catch {
          alert('JSON de condition invalide');
          setSaving(false);
          return;
        }
      }

      const payload = {
        ordre: parseInt(formData.ordre) || 1,
        role_requis: formData.role_requis || null,
        permission_requise: formData.permission_requise || null,
        condition: conditionObj,
        est_optionnelle: !!formData.est_optionnelle,
        actif: !!formData.actif,
      };

      if (editingEtape) {
        await api.put(`/workflow/etapes/${editingEtape.id}/`, payload);
      } else {
        await api.post(`/workflow/${typeWorkflow}/etapes/`, {
          ...payload,
          type_workflow: typeWorkflow,
          organisation_id: 1, // sera remplacé côté backend
        });
      }
      setModalOpen(false);
      await fetchEtapes();
    } catch (err) {
      alert(err.response?.data?.message || t('workflow.loadError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (etape) => {
    if (!window.confirm(t('workflow.deleteConfirm'))) return;
    try {
      await api.delete(`/workflow/etapes/${etape.id}/`);
      await fetchEtapes();
    } catch (err) {
      alert(err.response?.data?.message || t('workflow.loadError'));
    }
  };

  return (
    <AppPage>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
            <AdjustmentsHorizontalIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-page-title text-gray-900 dark:text-slate-100">
              {t('workflow.title')}
            </h1>
            <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
              {t('workflow.subtitle')}
            </p>
          </div>
        </div>
        {canGerer && (
          <Button variant="primary" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            {t('workflow.addEtape')}
          </Button>
        )}
      </div>

      <Card compact>
        <div className="flex flex-wrap gap-2 mb-4">
          {TYPES_WORKFLOW.map((type) => (
            <button
              key={type}
              onClick={() => setTypeWorkflow(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeWorkflow === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-night-muted dark:text-slate-200 dark:hover:bg-night-muted-hover'
              }`}
            >
              {t(`workflow.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : etapes.length === 0 ? (
          <div className="text-center py-16">
            <AdjustmentsHorizontalIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('workflow.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-light dark:border-border-dark text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-3">{t('workflow.colOrdre')}</th>
                  <th className="py-3 px-3">{t('workflow.colRole')}</th>
                  <th className="py-3 px-3">{t('workflow.colPermission')}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{t('workflow.colOptionnelle')}</th>
                  <th className="py-3 px-3">{t('workflow.colActif')}</th>
                  <th className="py-3 px-3 text-right">{t('workflow.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {etapes.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-night-active/40">
                    <td className="py-3 px-3 font-semibold">{e.ordre}</td>
                    <td className="py-3 px-3">{e.role_requis || '—'}</td>
                    <td className="py-3 px-3 font-mono text-xs">{e.permission_requise || '—'}</td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      {e.est_optionnelle ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-warning/10 text-warning">
                          {t('common.yes')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-slate-400">{t('common.no')}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {e.actif ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> {t('workflow.etapeActive')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <XCircleIcon className="w-3.5 h-3.5" /> {t('workflow.etapeInactive')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canGerer && (
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEdit(e)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600"
                            title={t('common.edit')}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-danger/10 hover:text-danger"
                            title={t('common.delete')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              {editingEtape ? t('workflow.editEtape') : t('workflow.addEtape')}
            </h3>
            <div className="space-y-4">
              <Input
                type="number"
                label={t('workflow.ordre')}
                value={formData.ordre}
                onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
                min={1}
              />
              <Input
                label={t('workflow.roleRequis')}
                value={formData.role_requis}
                onChange={(e) => setFormData({ ...formData, role_requis: e.target.value })}
                placeholder={t('workflow.roleHelp')}
              />
              <Input
                label={t('workflow.permissionRequise')}
                value={formData.permission_requise}
                onChange={(e) => setFormData({ ...formData, permission_requise: e.target.value })}
                placeholder={t('workflow.permissionHelp')}
              />
              <Input
                label={t('workflow.condition')}
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                placeholder={t('workflow.conditionHelp')}
              />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!formData.est_optionnelle}
                    onChange={(e) => setFormData({ ...formData, est_optionnelle: e.target.checked })}
                  />
                  {t('workflow.estOptionnelle')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  />
                  {t('workflow.actif')}
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" isLoading={saving} onClick={handleSave}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
};

export default GestionWorkflow;