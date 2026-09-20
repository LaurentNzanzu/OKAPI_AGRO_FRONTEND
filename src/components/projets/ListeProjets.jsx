// frontend/src/components/projets/ListeProjets.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PageLoader from '../common/PageLoader';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  FolderOpenIcon,
  ArrowPathIcon,
} from '../ui/icons';

const ListeProjets = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [estActif, setEstActif] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (estActif === 'true') params.est_actif = true;
      if (estActif === 'false') params.est_actif = false;
      const { data } = await api.get('/projets/', { params });
      setProjets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || t('projets.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search, estActif, t]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  const canGerer = hasPermission('projet.gerer');

  const computePct = (budget, consomme) => {
    const b = parseFloat(budget || 0);
    const c = parseFloat(consomme || 0);
    if (b <= 0) return 0;
    return Math.min(100, (c / b) * 100);
  };

  if (loading && projets.length === 0) return <PageLoader />;

  return (
    <AppPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
            <FolderOpenIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-page-title text-gray-900 dark:text-slate-100">
              {t('projets.title')}
            </h1>
            <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
              {t('projets.subtitle')}
            </p>
          </div>
        </div>
        {canGerer && (
          <Button variant="primary" onClick={() => navigate('/projets/nouveau')}>
            <PlusIcon className="w-4 h-4" />
            {t('projets.new')}
          </Button>
        )}
      </div>

      <Card compact>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              icon={MagnifyingGlassIcon}
              placeholder={t('projets.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={estActif}
            onChange={(e) => setEstActif(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
          >
            <option value="">{t('projets.filterAll')}</option>
            <option value="true">{t('projets.filterActifs')}</option>
            <option value="false">{t('projets.filterInactifs')}</option>
          </select>
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-night-active text-gray-600 dark:text-slate-300"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {error}
          </div>
        )}

        {projets.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpenIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('projets.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-light dark:border-border-dark text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-3">{t('projets.colCode')}</th>
                  <th className="py-3 px-3">{t('projets.colNom')}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{t('projets.colBailleur')}</th>
                  <th className="py-3 px-3">{t('projets.colBudget')}</th>
                  <th className="py-3 px-3">{t('projets.tauxUtilisation')}</th>
                  <th className="py-3 px-3">{t('projets.colStatut')}</th>
                  <th className="py-3 px-3 text-right">{t('projets.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {projets.map((p) => {
                  const pct = computePct(p.budget_annuel, p.budget_consomme);
                  const alerte = pct >= 80;
                  const depasse = pct >= 100;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-night-active/40">
                      <td className="py-3 px-3 font-mono font-semibold">{p.code}</td>
                      <td className="py-3 px-3">{p.nom}</td>
                      <td className="py-3 px-3 hidden md:table-cell text-gray-600 dark:text-slate-300">
                        {p.bailleur || '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {parseFloat(p.budget_annuel).toFixed(2)} {p.devise}
                      </td>
                      <td className="py-3 px-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-night-muted overflow-hidden">
                            <div
                              className={`h-full ${depasse ? 'bg-danger' : alerte ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${depasse ? 'text-danger' : alerte ? 'text-warning' : 'text-gray-600 dark:text-slate-300'}`}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.est_actif ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-slate-300'}`}>
                          {p.est_actif ? t('projets.statutActif') : t('projets.statutInactif')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => navigate(`/projets/${p.id}`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600"
                            title={t('common.view')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {canGerer && (
                            <button
                              onClick={() => navigate(`/projets/${p.id}`)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600"
                              title={t('common.edit')}
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppPage>
  );
};

export default ListeProjets;