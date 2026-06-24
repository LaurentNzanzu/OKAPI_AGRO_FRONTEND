// frontend/src/components/audit/HistoriqueModifications.jsx
import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/audit';
import { formatDate } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';

const HistoriqueModifications = ({ table, idEnregistrement, onClose }) => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorique = async () => {
      if (!table || !idEnregistrement) return;
      try {
        const data = await auditService.getHistoriqueEnregistrement(table, idEnregistrement);
        setLogs(data);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorique();
  }, [table, idEnregistrement]);

  if (loading) return <div className="p-4 text-center">{t('auditHistorique.loading')}</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {t('auditHistorique.title', { table, id: idEnregistrement })}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 text-2xl" aria-label={t('common.cancel')}>&times;</button>
        </div>
        <div className="p-4">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 text-left">{t('auditHistorique.colDate')}</th>
                <th className="px-4 py-2 text-left">{t('auditHistorique.colUser')}</th>
                <th className="px-4 py-2 text-left">{t('auditHistorique.colAction')}</th>
                <th className="px-4 py-2 text-left">{t('auditHistorique.colOld')}</th>
                <th className="px-4 py-2 text-left">{t('auditHistorique.colNew')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id_log} className="border-t">
                  <td className="px-4 py-2 text-sm">{formatDate(log.date_action)}</td>
                  <td className="px-4 py-2 text-sm">{log.utilisateur_nom}</td>
                  <td className="px-4 py-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    <pre className="whitespace-pre-wrap max-w-xs overflow-auto">
                      {JSON.stringify(log.anciennes_valeurs, null, 2)}
                    </pre>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono">
                    <pre className="whitespace-pre-wrap max-w-xs overflow-auto">
                      {JSON.stringify(log.nouvelles_valeurs, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoriqueModifications;
