// frontend/src/components/organisations/ListeOrganisations.jsx
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
  ShieldCheckIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
} from '../ui/icons';

const PLAN_BADGE = {
  BASIC: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-slate-200',
  PRO: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
  ENTERPRISE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const STATUT_BADGE = {
  ACTIF: 'bg-success/10 text-success dark:bg-success/20',
  SUSPENDU: 'bg-warning/10 text-warning dark:bg-warning/20',
  EXPIRE: 'bg-danger/10 text-danger dark:bg-danger/20',
};

const ListeOrganisations = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  const fetchOrganisations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statutFilter) params.statut = statutFilter;
      const { data } = await api.get('/organisations/', { params });
      setOrganisations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || t('organisations.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search, statutFilter, t]);

  useEffect(() => {
    const timeout = setTimeout(fetchOrganisations, 300);
    return () => clearTimeout(timeout);
  }, [fetchOrganisations]);

  const canGerer = hasPermission('organisation.gerer');

  if (loading && organisations.length === 0) return <PageLoader />;

  return (
    <AppPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
            <BuildingOffice2Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-page-title text-gray-900 dark:text-slate-100">
              {t('organisations.title')}
            </h1>
            <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
              {t('organisations.subtitle')}
            </p>
          </div>
        </div>
        {canGerer && (
          <Button onClick={() => navigate('/organisations/nouveau')} variant="primary">
            <PlusIcon className="w-4 h-4" />
            {t('organisations.new')}
          </Button>
        )}
      </div>

      <Card compact>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              icon={MagnifyingGlassIcon}
              placeholder={t('organisations.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="">{t('organisations.filterAll')}</option>
            <option value="ACTIF">{t('organisations.statutActif')}</option>
            <option value="SUSPENDU">{t('organisations.statutSuspendu')}</option>
            <option value="EXPIRE">{t('organisations.statutExpire')}</option>
          </select>
          <button
            type="button"
            onClick={fetchOrganisations}
            className="p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-night-active text-gray-600 dark:text-slate-300 transition-colors"
            title={t('common.refresh')}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger">
            {error}
          </div>
        )}

        {organisations.length === 0 ? (
          <div className="text-center py-16">
            <BuildingOffice2Icon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('organisations.empty')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-light dark:border-border-dark text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-3">{t('organisations.colCode')}</th>
                  <th className="py-3 px-3">{t('organisations.colNom')}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{t('organisations.colEmail')}</th>
                  <th className="py-3 px-3">{t('organisations.colPlan')}</th>
                  <th className="py-3 px-3">{t('organisations.colStatut')}</th>
                  <th className="py-3 px-3 text-right">{t('organisations.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {organisations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50 dark:hover:bg-night-active/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-semibold text-gray-900 dark:text-slate-100">
                      {org.code}
                    </td>
                    <td className="py-3 px-3 text-gray-900 dark:text-slate-100">{org.nom}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-slate-300 hidden md:table-cell">
                      {org.email_admin}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[org.plan_abonnement] || ''}`}>
                        {org.plan_abonnement}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGE[org.statut] || ''}`}>
                        {t(`organisations.statut${org.statut.charAt(0) + org.statut.slice(1).toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => navigate(`/organisations/${org.id}`)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 transition-colors"
                          title={t('common.view')}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {canGerer && (
                          <button
                            onClick={() => navigate(`/organisations/${org.id}`)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 transition-colors"
                            title={t('common.edit')}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppPage>
  );
};

export default ListeOrganisations;