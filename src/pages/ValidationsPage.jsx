// frontend/src/pages/ValidationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { validationsService } from '../services/validations';
import { besoinsService } from '../services/besoins';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatPrice } from '../utils/formatters';
import AppPage from '../components/ui/AppPage';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import {
  CheckBadgeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../components/ui/icons';

const StatutBadge = ({ statut }) => {
  const { t } = useTranslation();
  
  const configs = {
    'EN_ATTENTE_COMPTABLE': { 
      label: t('validations.status.waitingAccounting'), 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      icon: ClockIcon
    },
    'COMPTABLE_VALIDE': { 
      label: t('validations.status.accountingValidated'), 
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      icon: CheckCircleIcon
    },
    'EN_ATTENTE_CAISSE': { 
      label: t('validations.status.waitingCashier'), 
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      icon: ClockIcon
    },
    'CAISSE_VALIDE': { 
      label: t('validations.status.cashierValidated'), 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      icon: CheckCircleIcon
    },
    'EN_ATTENTE_DG': { 
      label: t('validations.status.waitingDG'), 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      icon: ClockIcon
    },
    'APPROUVEE': { 
      label: t('validations.status.approved'), 
      color: 'bg-success/10 text-success',
      icon: CheckCircleIcon
    },
    'REJETE': { 
      label: t('validations.status.rejected'), 
      color: 'bg-danger/10 text-danger',
      icon: XCircleIcon
    },
    'ATTENTE_STOCK': { 
      label: t('validations.status.waitingStock'), 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      icon: ExclamationTriangleIcon
    },
  };

  const config = configs[statut] || configs['EN_ATTENTE_COMPTABLE'];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <AppIcon icon={Icon} size="xs" />
      {config.label}
    </span>
  );
};

const DecisionBadge = ({ decision, motif }) => {
  const { t } = useTranslation();
  
  if (decision === 'APPROUVE') {
    return (
      <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
        <AppIcon icon={CheckCircleIcon} size="xs" />
        {t('validations.decision.approved')}
      </span>
    );
  }
  if (decision === 'REJETE') {
    return (
      <span className="inline-flex items-center gap-1 text-danger text-xs font-medium" title={motif}>
        <AppIcon icon={XCircleIcon} size="xs" />
        {t('validations.decision.rejected')}
        {motif && <span className="text-gray-400 dark:text-slate-500 ml-0.5">: {motif}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
      <AppIcon icon={ClockIcon} size="xs" />
      {t('validations.decision.pending')}
    </span>
  );
};

const ValidationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validations, setValidations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    approuvees: 0,
    rejetees: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const userRole = user?.role?.nom?.toUpperCase() || '';

  const fetchValidations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les validations en attente pour l'utilisateur
      const data = await validationsService.getEnAttente();
      setValidations(data || []);
      
      // Calculer les statistiques
      const total = data?.length || 0;
      const enAttente = data?.filter(v => 
        v.statut === 'EN_ATTENTE_COMPTABLE' || 
        v.statut === 'EN_ATTENTE_CAISSE' || 
        v.statut === 'EN_ATTENTE_DG'
      ).length || 0;
      const approuvees = data?.filter(v => v.statut === 'APPROUVEE').length || 0;
      const rejetees = data?.filter(v => v.statut === 'REJETE').length || 0;
      
      setStats({ total, enAttente, approuvees, rejetees });
    } catch (err) {
      console.error('Erreur chargement validations:', err);
      setError(err.response?.data?.detail || t('validations.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchValidations();
  }, [fetchValidations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchValidations();
  };

  const getFilteredValidations = () => {
    let filtered = [...validations];

    if (filter !== 'all') {
      filtered = filtered.filter(v => v.statut === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.numero_demande?.toLowerCase().includes(term) ||
        v.bien_designation?.toLowerCase().includes(term) ||
        v.id_bien?.toString().includes(term)
      );
    }

    return filtered;
  };

  const filteredValidations = getFilteredValidations();

  // Déterminer le rôle de l'utilisateur pour l'affichage
  const getRoleLabel = () => {
    const roleMap = {
      'DG': t('validations.roles.dg'),
      'COMPTABLE': t('validations.roles.accounting'),
      'CAISSE': t('validations.roles.cashier'),
    };
    return roleMap[userRole] || t('validations.roles.default');
  };

  const getEmptyMessage = () => {
    if (searchTerm || filter !== 'all') {
      return t('validations.empty.filtered');
    }
    return t('validations.empty.none', { role: getRoleLabel() });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title={t('validations.title')}
        subtitle={t('validations.subtitle', { role: getRoleLabel() })}
        icon={CheckBadgeIcon}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
            >
              <AppIcon icon={ArrowPathIcon} size="sm" className="mr-1" />
              {t('common.refresh')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/validations/historique')}
            >
              <AppIcon icon={DocumentTextIcon} size="sm" className="mr-1" />
              {t('validations.history')}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-2 text-danger text-sm">
          <AppIcon icon={ExclamationTriangleIcon} size="sm" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard 
          label={t('validations.stats.total')} 
          value={stats.total} 
          icon={DocumentTextIcon}
          className="bg-primary-50 dark:bg-primary-900/10"
        />
        <StatCard 
          label={t('validations.stats.pending')} 
          value={stats.enAttente} 
          icon={ClockIcon}
          className="bg-warning/10"
          valueClassName="text-warning"
        />
        <StatCard 
          label={t('validations.stats.approved')} 
          value={stats.approuvees} 
          icon={CheckCircleIcon}
          className="bg-success/10"
          valueClassName="text-success"
        />
        <StatCard 
          label={t('validations.stats.rejected')} 
          value={stats.rejetees} 
          icon={XCircleIcon}
          className="bg-danger/10"
          valueClassName="text-danger"
        />
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
              placeholder={t('validations.searchPlaceholder')}
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
            <option value="all">{t('validations.filter.all')}</option>
            <option value="EN_ATTENTE_COMPTABLE">{t('validations.filter.waitingAccounting')}</option>
            <option value="COMPTABLE_VALIDE">{t('validations.filter.accountingValidated')}</option>
            <option value="EN_ATTENTE_CAISSE">{t('validations.filter.waitingCashier')}</option>
            <option value="CAISSE_VALIDE">{t('validations.filter.cashierValidated')}</option>
            <option value="EN_ATTENTE_DG">{t('validations.filter.waitingDG')}</option>
            <option value="APPROUVEE">{t('validations.filter.approved')}</option>
            <option value="REJETE">{t('validations.filter.rejected')}</option>
            <option value="ATTENTE_STOCK">{t('validations.filter.waitingStock')}</option>
          </select>
        </div>
      </div>

      {/* Liste des validations */}
      <Card title={t('validations.list')} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-night-active">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.number')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.asset')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.date')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.amount')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.status')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.decision')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('validations.col.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredValidations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500">
                      <AppIcon icon={CheckBadgeIcon} size="lg" className="opacity-30" />
                      <p className="text-sm">{getEmptyMessage()}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredValidations.map((validation) => (
                  <tr 
                    key={validation.id_besoin || validation.id} 
                    className="hover:bg-gray-50 dark:hover:bg-night-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/validations/${validation.id_besoin || validation.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                      {validation.numero_demande || `#${validation.id_besoin || validation.id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span>{validation.bien_designation || `Bien #${validation.id_bien}`}</span>
                        {validation.type_bien && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {validation.type_bien}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                      {formatDate(validation.date_creation)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-slate-100">
                      {formatPrice(validation.montant_total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatutBadge statut={validation.statut} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DecisionBadge 
                        decision={validation.decision} 
                        motif={validation.motif_rejet} 
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/validations/${validation.id_besoin || validation.id}`);
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

        {/* Pied de tableau avec informations */}
        {filteredValidations.length > 0 && (
          <div className="px-4 py-3 border-t border-border-light dark:border-border-dark flex justify-between items-center text-xs text-gray-500 dark:text-slate-400">
            <span>
              {t('validations.showing', { 
                count: filteredValidations.length,
                total: validations.length 
              })}
            </span>
            <span>
              {t('validations.roleInfo', { role: getRoleLabel() })}
            </span>
          </div>
        )}
      </Card>

      {/* Instructions rapides */}
      <div className="p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AppIcon icon={UserGroupIcon} size="md" className="text-primary-600 dark:text-primary-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {t('validations.instructions.title')}
            </p>
            <p className="text-sm text-primary-600 dark:text-primary-400">
              {t('validations.instructions.description')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-primary-600 dark:text-primary-400 list-disc list-inside">
              <li>{t('validations.instructions.step1')}</li>
              <li>{t('validations.instructions.step2')}</li>
              <li>{t('validations.instructions.step3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </AppPage>
  );
};

export default ValidationsPage;