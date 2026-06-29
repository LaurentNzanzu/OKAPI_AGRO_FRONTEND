// frontend/src/components/besoins/EtatBesoins.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { besoinsService } from '../../services/besoins';
import { validationsService } from '../../services/validations';
import { formatDate, formatPrice } from '../../utils/formatters';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';

const StatutBadge = ({ statut }) => {
  const configs = {
    'BROUILLON': { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-slate-400' },
    'EN_ATTENTE_COMPTABLE': { label: 'Attente Comptable', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
    'COMPTABLE_VALIDE': { label: 'Comptable Validé', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
    'EN_ATTENTE_CAISSE': { label: 'Attente Caisse', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300' },
    'CAISSE_VALIDE': { label: 'Caisse Validé', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' },
    'APPROUVEE': { label: 'Approuvée', color: 'bg-success/10 text-success' },
    'REJETE': { label: 'Rejetée', color: 'bg-danger/10 text-danger' },
    'ATTENTE_STOCK': { label: 'Attente Stock', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' },
  };

  const config = configs[statut] || configs['BROUILLON'];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const DecisionBadge = ({ decision, motif }) => {
  if (decision === 'APPROUVE') {
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <AppIcon icon={CheckCircleIcon} size="xs" />
        Approuvé
      </span>
    );
  }
  if (decision === 'REJETE') {
    return (
      <span className="flex items-center gap-1 text-danger text-xs" title={motif}>
        <AppIcon icon={XCircleIcon} size="xs" />
        Rejeté {motif && `: ${motif}`}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-gray-400 text-xs">
      <AppIcon icon={ClockIcon} size="xs" />
      En attente
    </span>
  );
};

const EtatBesoins = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [besoins, setBesoins] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBesoins();
  }, []);

  const fetchBesoins = async () => {
    try {
      setLoading(true);
      const data = await besoinsService.getAll();
      setBesoins(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement besoins:', err);
      setError(err.response?.data?.detail || t('besoins.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBesoins = () => {
    let filtered = [...besoins];

    if (filter !== 'all') {
      filtered = filtered.filter(b => b.statut === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.numero_demande?.toLowerCase().includes(term) ||
        b.id_bien?.toString().includes(term) ||
        b.bien_designation?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredBesoins = getFilteredBesoins();

  // Statistiques
  const stats = {
    total: besoins.length,
    enAttente: besoins.filter(b => b.statut === 'EN_ATTENTE_COMPTABLE' || b.statut === 'EN_ATTENTE_CAISSE').length,
    approuves: besoins.filter(b => b.statut === 'APPROUVEE').length,
    rejetes: besoins.filter(b => b.statut === 'REJETE').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title={t('besoins.title')}
        subtitle={t('besoins.subtitle')}
        icon={DocumentTextIcon}
        action={
          <Button
            variant="primary"
            onClick={() => navigate('/besoins/nouveau')}
          >
            <AppIcon icon={DocumentTextIcon} size="sm" className="mr-1" />
            {t('besoins.new')}
          </Button>
        }
      />

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="app-card app-card-body-compact text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{t('besoins.total')}</div>
        </div>
        <div className="app-card app-card-body-compact text-center">
          <div className="text-2xl font-bold text-warning">{stats.enAttente}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{t('besoins.pending')}</div>
        </div>
        <div className="app-card app-card-body-compact text-center">
          <div className="text-2xl font-bold text-success">{stats.approuves}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{t('besoins.approved')}</div>
        </div>
        <div className="app-card app-card-body-compact text-center">
          <div className="text-2xl font-bold text-danger">{stats.rejetes}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{t('besoins.rejected')}</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <AppIcon icon={MagnifyingGlassIcon} size="sm" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('besoins.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          >
            <option value="all">{t('besoins.filterAll')}</option>
            <option value="EN_ATTENTE_COMPTABLE">{t('besoins.filterAccounting')}</option>
            <option value="COMPTABLE_VALIDE">{t('besoins.filterAccountingValidated')}</option>
            <option value="EN_ATTENTE_CAISSE">{t('besoins.filterCashier')}</option>
            <option value="CAISSE_VALIDE">{t('besoins.filterCashierValidated')}</option>
            <option value="APPROUVEE">{t('besoins.filterApproved')}</option>
            <option value="REJETE">{t('besoins.filterRejected')}</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <Card title={t('besoins.list')} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-night-active">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colNumber')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colBien')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colDate')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colAmount')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colStatus')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colDecision')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('besoins.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredBesoins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                    {t('besoins.empty')}
                  </td>
                </tr>
              ) : (
                filteredBesoins.map((besoin) => (
                  <tr 
                    key={besoin.id_besoin} 
                    className="hover:bg-gray-50 dark:hover:bg-night-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/besoins/${besoin.id_besoin}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                      {besoin.numero_demande || `#${besoin.id_besoin}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                      {besoin.bien_designation || `Bien #${besoin.id_bien}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                      {formatDate(besoin.date_creation)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-slate-100">
                      {formatPrice(besoin.montant_total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatutBadge statut={besoin.statut} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DecisionBadge 
                        decision={besoin.decision} 
                        motif={besoin.motif_rejet} 
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/besoins/${besoin.id_besoin}`);
                        }}
                      >
                        <AppIcon icon={EyeIcon} size="sm" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppPage>
  );
};

export default EtatBesoins;