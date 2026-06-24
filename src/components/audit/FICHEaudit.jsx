// frontend/src/components/audit/FicheAudit.jsx
import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/audit';
import { formatDate } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';

const FicheAudit = ({ logId, onClose }) => {
  const { t } = useTranslation();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId) return;
      try {
        const data = await auditService.getLogById(logId);
        setLog(data);
      } catch (err) {
        console.error('Erreur chargement fiche audit:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  if (loading) return <div className="p-4 text-center">{t('auditFiche.loading')}</div>;
  if (!log) return <div className="p-4 text-red-500">{t('auditFiche.notFound')}</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('auditFiche.title', { id: log.id_log })}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 text-2xl" aria-label={t('common.cancel')}>&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-semibold">{t('auditFiche.date')}:</span> {formatDate(log.date_action)}</div>
            <div><span className="font-semibold">{t('auditFiche.user')}:</span> {log.utilisateur_nom || t('auditFiche.system')}</div>
            <div><span className="font-semibold">{t('auditFiche.table')}:</span> {log.table_concernee}</div>
            <div><span className="font-semibold">{t('auditFiche.action')}:</span> 
              <span className="ml-2 px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-200">
                {log.action}
              </span>
            </div>
            <div><span className="font-semibold">{t('auditFiche.recordId')}:</span> {log.id_enregistrement}</div>
            {log.adresse_ip && <div><span className="font-semibold">{t('auditFiche.ip')}:</span> {log.adresse_ip}</div>}
          </div>

          {log.anciennes_valeurs && (
            <div>
              <span className="font-semibold">{t('auditFiche.oldValues')}:</span>
              <pre className="bg-gray-100 dark:bg-slate-800 p-2 rounded mt-1 text-sm overflow-auto max-h-40">
                {JSON.stringify(log.anciennes_valeurs, null, 2)}
              </pre>
            </div>
          )}
          {log.nouvelles_valeurs && (
            <div>
              <span className="font-semibold">{t('auditFiche.newValues')}:</span>
              <pre className="bg-gray-100 dark:bg-slate-800 p-2 rounded mt-1 text-sm overflow-auto max-h-40">
                {JSON.stringify(log.nouvelles_valeurs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FicheAudit;
