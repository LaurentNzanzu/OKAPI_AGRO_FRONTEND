// frontend/src/components/audit/JournalImmobilisations.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { auditService } from '../../services/audit';
import { formatDate, formatPrice } from '../../utils/formatters';
import {
  AppIcon,
  ArrowRightCircleIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  EyeIcon,
} from '../ui/icons';

const JournalImmobilisations = ({ bienId }) => {
  const { t } = useTranslation();
  const [journal, setJournal] = useState({ evenements: [], arbre_remplacement: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (bienId) {
      chargerJournal();
    }
  }, [bienId]);

  const chargerJournal = async () => {
    try {
      setLoading(true);
      const data = await auditService.getJournalImmobilisations(bienId);
      setJournal(data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement journal:', err);
      setError(t('journal.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type) => {
    const configs = {
      ACQUISITION: {
        icon: BuildingOffice2Icon,
        color: 'border-green-500 bg-green-50 dark:bg-green-900/20',
        label: t('journal.type.acquisition'),
      },
      REVALUATION: {
        icon: ChartBarIcon,
        color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
        label: t('journal.type.revaluation'),
      },
      DEPRECIATION: {
        icon: ArrowUpTrayIcon,
        color: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
        label: t('journal.type.depreciation'),
      },
      AMORTISSEMENT: {
        icon: CurrencyDollarIcon,
        color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
        label: t('journal.type.amortissement'),
      },
      PANNE: {
        icon: ExclamationTriangleIcon,
        color: 'border-red-500 bg-red-50 dark:bg-red-900/20',
        label: t('journal.type.panne'),
      },
      MAINTENANCE: {
        icon: WrenchScrewdriverIcon,
        color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
        label: t('journal.type.maintenance'),
      },
      SORTIE_CESSION: {
        icon: ArrowUpTrayIcon,
        color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
        label: t('journal.type.cession'),
      },
      SORTIE_REBUT: {
        icon: TrashIcon,
        color: 'border-gray-500 bg-gray-50 dark:bg-gray-800/50',
        label: t('journal.type.rebut'),
      },
      TRANSFERT: {
        icon: ArrowRightCircleIcon,
        color: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
        label: t('journal.type.transfert'),
      },
      ALERTE_VNC: {
        icon: ExclamationTriangleIcon,
        color: 'border-red-500 bg-red-50 dark:bg-red-900/20',
        label: t('journal.type.alerteVNC'),
      },
      SCORE_FIABILITE: {
        icon: ChartBarIcon,
        color: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20',
        label: t('journal.type.scoreFiabilite'),
      },
      REMPLACEMENT: {
        icon: ArrowRightCircleIcon,
        color: 'border-green-500 bg-green-50 dark:bg-green-900/20',
        label: t('journal.type.remplacement'),
      },
    };
    return configs[type] || {
      icon: ClockIcon,
      color: 'border-gray-300 bg-gray-50 dark:bg-gray-800/50',
      label: type || t('journal.type.unknown'),
    };
  };

  const displayedEvents = showAll 
    ? journal.evenements 
    : journal.evenements?.slice(0, 10) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner w-8 h-8 border-4" />
        <span className="ml-3 text-gray-500 dark:text-slate-400">
          {t('journal.loading')}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Journal des événements */}
      <Card
        title={t('journal.title')}
        subtitle={t('journal.subtitle', { count: journal.evenements?.length || 0 })}
        icon={<AppIcon icon={ClockIcon} size="md" className="text-primary-600" />}
        actions={
          journal.evenements?.length > 10 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? t('journal.showLess') : t('journal.showMore')}
            </Button>
          )
        }
      >
        {journal.evenements?.length === 0 ? (
          <div className="empty-state">
            <AppIcon icon={CheckCircleIcon} size="lg" className="text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-slate-400">
              {t('journal.noEvents')}
            </p>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Ligne verticale de la timeline */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {displayedEvents.map((event, index) => {
              const config = getTypeConfig(event.type);
              const IconComponent = config.icon;

              return (
                <div key={index} className="relative flex items-start gap-4 mb-6 last:mb-0">
                  {/* Cercle de la timeline */}
                  <div className={`w-8 h-8 rounded-full border-2 ${config.color} flex items-center justify-center z-10 shrink-0`}>
                    <AppIcon icon={IconComponent} size="sm" className="text-gray-600 dark:text-gray-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{config.label}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {formatDate(event.date)}
                      </span>
                      {event.montant > 0 && (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {formatPrice(event.montant)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-slate-300 text-sm">
                      {event.libelle}
                    </p>
                    {event.reference && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {t('journal.reference')}: {event.reference}
                      </p>
                    )}
                    {event.ancienne_valeur && event.nouvelle_valeur && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {formatPrice(event.ancienne_valeur)} → {formatPrice(event.nouvelle_valeur)}
                      </div>
                    )}
                    {event.utilisateur && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {t('journal.by')}: {event.utilisateur}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {journal.evenements?.length > 10 && !showAll && (
              <div className="text-center pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAll(true)}
                >
                  {t('journal.viewAll', { count: journal.evenements.length })}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Arbre de remplacement */}
      {journal.arbre_remplacement?.length > 0 && (
        <Card
          title={t('journal.replacementTree')}
          icon={<AppIcon icon={ArrowRightCircleIcon} size="md" className="text-blue-500" />}
        >
          <div className="space-y-3">
            {journal.arbre_remplacement.map((remp, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('journal.asset')} #{remp.ancien_bien_id}
                </span>
                <AppIcon icon={ArrowRightCircleIcon} size="md" className="text-gray-400" />
                <Link
                  to={`/biens/${remp.nouveau_bien_id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {remp.nouveau_bien_nom || `#${remp.nouveau_bien_id}`}
                </Link>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  ({formatDate(remp.date)})
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default JournalImmobilisations;