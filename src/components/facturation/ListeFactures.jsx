// frontend/src/components/facturation/ListeFactures.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppPage from '../ui/AppPage';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PageLoader from '../common/PageLoader';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
} from '../ui/icons';

const STATUT_BADGE = {
  PAYE: 'bg-success/10 text-success',
  EN_ATTENTE: 'bg-warning/10 text-warning',
  RETARD: 'bg-danger/10 text-danger',
};

const ListeFactures = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statut, setStatut] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statut) params.statut = statut;
      const { data } = await api.get('/facturation/', { params });
      setFactures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || t('facturation.loadError'));
    } finally {
      setLoading(false);
    }
  }, [statut, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaiement = async (id) => {
    if (!window.confirm(t('facturation.paiementConfirm'))) return;
    try {
      await api.post(`/facturation/${id}/paiement/`, {});
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || t('facturation.loadError'));
    }
  };

  const handleVoirPdf = async (id) => {
    try {
      const { data } = await api.get(`/facturation/${id}/pdf/`);
      alert(data.message || t('facturation.pdfStub'));
    } catch (err) {
      alert(err.response?.data?.message || t('facturation.loadError'));
    }
  };

  if (loading && factures.length === 0) return <PageLoader />;

  return (
    <AppPage>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200">
          <BanknotesIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-page-title text-gray-900 dark:text-slate-100">
            {t('facturation.title')}
          </h1>
          <p className="text-page-subtitle text-gray-500 dark:text-slate-400">
            {t('facturation.subtitle')}
          </p>
        </div>
      </div>

      <Card compact>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
          >
            <option value="">{t('facturation.filterAll')}</option>
            <option value="EN_ATTENTE">{t('facturation.statutEnAttente')}</option>
            <option value="PAYE">{t('facturation.statutPaye')}</option>
            <option value="RETARD">{t('facturation.statutRetard')}</option>
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

        {factures.length === 0 ? (
          <div className="text-center py-16">
            <BanknotesIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('facturation.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-light dark:border-border-dark text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-3">{t('facturation.colId')}</th>
                  <th className="py-3 px-3">{t('facturation.colPeriode')}</th>
                  <th className="py-3 px-3">{t('facturation.colMontant')}</th>
                  <th className="py-3 px-3">{t('facturation.colStatut')}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{t('facturation.colEcheance')}</th>
                  <th className="py-3 px-3 text-right">{t('facturation.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {factures.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-night-active/40">
                    <td className="py-3 px-3 font-mono">#{f.id}</td>
                    <td className="py-3 px-3">{f.periode}</td>
                    <td className="py-3 px-3 font-semibold">
                      {parseFloat(f.montant).toFixed(2)} {f.devise}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGE[f.statut_paiement] || ''}`}>
                        {f.statut_paiement === 'PAYE' && <CheckCircleIcon className="w-3 h-3" />}
                        {f.statut_paiement === 'EN_ATTENTE' && <ClockIcon className="w-3 h-3" />}
                        {f.statut_paiement === 'RETARD' && <ExclamationTriangleIcon className="w-3 h-3" />}
                        {t(`facturation.statut${f.statut_paiement === 'PAYE' ? 'Paye' : f.statut_paiement === 'EN_ATTENTE' ? 'EnAttente' : 'Retard'}`)}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-600 dark:text-slate-300">
                      {f.date_echeance || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => handleVoirPdf(f.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600"
                          title={t('facturation.voirPdf')}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {hasPermission('facturation.gerer') && f.statut_paiement !== 'PAYE' && (
                          <Button size="sm" variant="success" onClick={() => handlePaiement(f.id)}>
                            {t('facturation.enregistrerPaiement')}
                          </Button>
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

export default ListeFactures;