import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { pannesService } from '../../services/pannes';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { AppIcon, getPanneStatutConfig, StatusBadge, WrenchScrewdriverIcon, PlusIcon } from '../ui/icons';

const MesPannes = () => {
  const { t } = useTranslation();
  const panneStatutConfig = useMemo(() => getPanneStatutConfig(t), [t]);
  const [pannes, setPannes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  const fetchPannes = async () => {
    try {
      setLoading(true);
      const data = await pannesService.getMesPannes(filter === 'all' ? null : filter);
      setPannes(data);
    } catch (err) {
      console.error('Erreur chargement pannes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPannes();
  }, [filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="spinner w-10 h-10 border-2" />
      </div>
    );
  }

  const filterOptions = ['all', 'DECLAREE', 'DIAGNOSTIQUEE', 'EN_ATTENTE_PIECES', 'EN_VALIDATION', 'EN_COURS', 'TERMINEE'];

  return (
    <AppPage>
      <PageHeader
        title={t('pannes.mesPannes.title')}
        icon={WrenchScrewdriverIcon}
        action={
          <Link to="/pannes/declarer">
            <Button className="w-full sm:w-auto">
              <AppIcon icon={PlusIcon} size="sm" className="text-white" />
              {t('pannes.mesPannes.nouvellePanne')}
            </Button>
          </Link>
        }
      />

      <Card compact noPadding>
        <div className="p-3 md:p-4 flex flex-wrap gap-2">
          {filterOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s === 'all' ? t('common.all') : panneStatutConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </Card>

      {pannes.length === 0 ? (
        <Card compact>
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-slate-400">{t('pannes.mesPannes.empty')}</p>
            <Link
              to="/pannes/declarer"
              className="text-primary-600 dark:text-primary-200 mt-2 inline-block text-sm font-medium hover:underline"
            >
              {t('pannes.mesPannes.declarer')}
            </Link>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pannes.map((panne) => {
            const statutConfig = panneStatutConfig[panne.statut];
            return (
              <Link
                key={panne.id_panne}
                to={`/pannes/${panne.id_panne}`}
                className="app-card app-card-body-compact block hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {t('pannes.mesPannes.panneTitle', { id: panne.id_panne })}
                      </h3>
                      {statutConfig ? (
                        <StatusBadge
                          label={statutConfig.label}
                          Icon={statutConfig.Icon}
                          color={statutConfig.color}
                        />
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                          {panne.statut}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                      {panne.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-slate-500">
                      <span>{new Date(panne.date_declaration).toLocaleDateString('fr-FR')}</span>
                      <span>{panne.cout_total_reparation?.toLocaleString()} USD</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400 shrink-0">
                    {panne.type_panne}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppPage>
  );
};

export default MesPannes;
