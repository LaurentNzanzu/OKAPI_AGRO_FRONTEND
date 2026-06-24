// frontend/src/components/audit/JournalAudit.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { auditService } from '../../services/audit';
import { formatDate } from '../../utils/formatters';
import FicheAudit from './FicheAudit'; // ✅ Composant modal pour détails
import HistoriqueModifications from './HistoriqueModifications'; // ✅ Composant modal historique
import PageHeader from '../ui/PageHeader';
import { ClipboardDocumentListIcon } from '../ui/icons';

const JournalAudit = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null); // Pour FicheAudit
  const [selectedHistory, setSelectedHistory] = useState(null); // Pour HistoriqueModifications
  const [filters, setFilters] = useState({
    table: '',
    action: '',
    date_debut: '',
    date_fin: '',
    page: 1,
    page_size: 50
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
        setLoading(true);
        // ✅ Utilisez le service mis à jour qui filtre les paramètres vides
        const data = await auditService.getLogs(filters);
        setLogs(data.items);
    } catch (err) {
        console.error('Erreur chargement audit:', err);
    } finally {
        setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-primary-100 text-primary-600',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
      VALIDER: 'bg-emerald-100 text-emerald-700',
      REJETER: 'bg-rose-100 text-rose-700'
    };
    return colors[action] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';
  };

  const openDetails = (log) => setSelectedLog(log);
  const openHistory = (log) => {
    if (log.table_concernee && log.id_enregistrement) {
      setSelectedHistory({
        table: log.table_concernee,
        id: log.id_enregistrement
      });
    }
  };
  const closeDetails = () => setSelectedLog(null);
  const closeHistory = () => setSelectedHistory(null);

  if (loading) {
    return <div className="text-center py-12">{t('audit.journal.loading')}</div>;
  }

  return (
    <div className="app-page">
      <PageHeader
        title={t('audit.journal.title')}
        subtitle={t('audit.journal.subtitle')}
        icon={ClipboardDocumentListIcon}
      />

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder={t('audit.journal.tablePlaceholder')}
            className="form-input"
            value={filters.table}
            onChange={(e) => setFilters({ ...filters, table: e.target.value, page: 1 })}
          />
          <select
            className="form-input"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          >
            <option value="">Toutes actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="VALIDER">VALIDER</option>
            <option value="REJETER">REJETER</option>
          </select>
          <input
            type="date"
            className="form-input"
            value={filters.date_debut}
            onChange={(e) => setFilters({ ...filters, date_debut: e.target.value, page: 1 })}
          />
          <input
            type="date"
            className="form-input"
            value={filters.date_fin}
            onChange={(e) => setFilters({ ...filters, date_fin: e.target.value, page: 1 })}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilters({ page: 1, page_size: 50, table: '', action: '', date_debut: '', date_fin: '' })}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Table</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Détails</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id_log} className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm">{formatDate(log.date_action)}</td>
                  <td className="px-4 py-3 text-sm">{log.utilisateur_nom || 'Système'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{log.table_concernee}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.id_enregistrement && `ID: ${log.id_enregistrement}`}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    {/* Bouton Détails */}
                    <button
                      onClick={() => openDetails(log)}
                      className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-600"
                    >
                      Détails
                    </button>
                    {/* Bouton Historique (seulement si UPDATE/DELETE et ID présent) */}
                    {(log.action === 'UPDATE' || log.action === 'DELETE') && log.id_enregistrement && (
                      <button
                        onClick={() => openHistory(log)}
                        className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600"
                      >
                        Historique
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {/* ... (votre pagination existante) ... */}
      </div>

      {/* Modals */}
      {selectedLog && (
        <FicheAudit
          logId={selectedLog.id_log}
          onClose={closeDetails}
        />
      )}

      {selectedHistory && (
        <HistoriqueModifications
          table={selectedHistory.table}
          idEnregistrement={selectedHistory.id}
          onClose={closeHistory}
        />
      )}
    </div>
  );
};

export default JournalAudit;