import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { formatDate, formatPrice } from '../../utils/formatters';
import RepriseDepreciation from './RepriseDepreciation';

const DepreciationHistory = ({ bienId, onRefresh }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepreciation, setSelectedDepreciation] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const result = await amortissementsService.getDepreciations(bienId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || t('common.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bienId) load();
  }, [bienId]);

  const handleRepriseSuccess = () => {
    setSelectedDepreciation(null);
    load();
    onRefresh?.();
  };

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">{t('depreciations.history.loading')}</p>;
  }

  if (error) {
    return <div className="alert-error text-sm">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {t('depreciations.history.cumulLabel')}{' '}
            <strong className="text-amber-700">{formatPrice(data?.cumul_depreciation || 0)}</strong>
          </p>
          <p className="text-xs text-gray-500">
            {t('common.accountingStatus')}: {data?.statut_comptable || '—'}
          </p>
        </div>
        {(data?.cumul_depreciation || 0) > 0 && !selectedDepreciation && (
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => setSelectedDepreciation({})}
            aria-label={t('depreciations.history.repriseAction')}
          >
            {t('depreciations.history.repriseAction')}
          </button>
        )}
      </div>

      {selectedDepreciation && (
        <RepriseDepreciation
          bienId={bienId}
          cumulDepreciation={data?.cumul_depreciation || 0}
          depreciationId={selectedDepreciation.id_amortissement}
          maxMontant={selectedDepreciation.montant_depreciation}
          onSuccess={handleRepriseSuccess}
          onCancel={() => setSelectedDepreciation(null)}
        />
      )}

      <div>
        <h4 className="font-medium text-sm mb-2">{t('depreciations.history.appliedTitle')}</h4>
        {!data?.depreciations?.length ? (
          <p className="text-sm text-gray-500">{t('depreciations.history.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('common.exercice')}</th>
                  <th>{t('common.amount')}</th>
                  <th>{t('common.newVnc')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.depreciations.map((d) => (
                  <tr key={d.id_amortissement}>
                    <td>{d.date_depreciation ? formatDate(d.date_depreciation) : '—'}</td>
                    <td>{d.exercice}</td>
                    <td className="text-amber-700 font-medium">{formatPrice(d.montant_depreciation)}</td>
                    <td>{formatPrice(d.valeur_actualisee)}</td>
                    <td>
                      {(data.cumul_depreciation || 0) > 0 && (
                        <button
                          type="button"
                          className="text-primary-600 hover:underline text-xs"
                          onClick={() => setSelectedDepreciation(d)}
                        >
                          {t('depreciations.history.repriseBtn')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.reprises?.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">{t('depreciations.history.reprisesTitle')}</h4>
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('common.amount')}</th>
                <th>{t('common.accounts')}</th>
                <th>{t('common.label')}</th>
              </tr>
            </thead>
            <tbody>
              {data.reprises.map((r) => (
                <tr key={r.id_ecriture}>
                  <td>{r.date_ecriture ? formatDate(r.date_ecriture) : '—'}</td>
                  <td className="text-green-700">{formatPrice(r.montant)}</td>
                  <td className="font-mono text-xs">{r.compte_debit} / {r.compte_credit}</td>
                  <td className="text-xs max-w-xs truncate">{r.libelle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DepreciationHistory;
