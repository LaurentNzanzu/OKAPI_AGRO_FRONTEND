// frontend/src/components/budgets/BudgetWidget.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { budgetsService } from '../../services/budgets';
import { formatPrice } from '../../utils/formatters';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import {
  WalletIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';

const BudgetWidget = ({ exercice }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [synthese, setSynthese] = useState(null);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    if (exercice) {
      fetchData();
    }
  }, [exercice]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [syntheseData, budgetsData] = await Promise.all([
        budgetsService.getSynthese(exercice).catch(() => null),
        budgetsService.getAll({ exercice, limit: 5 })
      ]);
      setSynthese(syntheseData);
      setBudgets(budgetsData || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement budgets:', err);
      setError(err.response?.data?.detail);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title={t('budgets.widget.title')}>
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={t('budgets.widget.title')}>
        <div className="text-center py-6 text-danger text-sm">{error}</div>
      </Card>
    );
  }

  if (!synthese) {
    return (
      <Card title={t('budgets.widget.title')}>
        <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm">
          {t('budgets.widget.noData')}
        </div>
      </Card>
    );
  }

  const tauxGlobal = synthese.taux_global_utilisation || 0;
  const estCritique = tauxGlobal > 90;
  const estAlerte = tauxGlobal > 70 && tauxGlobal <= 90;

  return (
    <Card 
      title={t('budgets.widget.title')}
      subtitle={t('budgets.widget.subtitle', { year: exercice })}
      icon={<AppIcon icon={WalletIcon} size="md" />}
      actions={
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/budgets')}
        >
          <AppIcon icon={ArrowRightIcon} size="sm" />
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Synthèse globale */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-primary-600">
              {formatPrice(synthese.total_alloue)}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {t('budgets.widget.alloue')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warning">
              {formatPrice(synthese.total_utilise)}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {t('budgets.widget.utilise')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-success">
              {formatPrice(synthese.total_disponible)}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {t('budgets.widget.disponible')}
            </div>
          </div>
        </div>

        {/* Barre de progression globale */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-slate-400">
              {t('budgets.widget.tauxUtilisation')}
            </span>
            <span className={`font-medium ${estCritique ? 'text-danger' : estAlerte ? 'text-warning' : 'text-success'}`}>
              {tauxGlobal.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-night-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${estCritique ? 'bg-danger' : estAlerte ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${Math.min(tauxGlobal, 100)}%` }}
            />
          </div>
        </div>

        {/* Alertes */}
        {estCritique && (
          <div className="p-2 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-2 text-danger text-sm">
            <AppIcon icon={ExclamationTriangleIcon} size="sm" className="mt-0.5 shrink-0" />
            <span>{t('budgets.widget.alerteCritique')}</span>
          </div>
        )}
        {estAlerte && !estCritique && (
          <div className="p-2 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2 text-warning text-sm">
            <AppIcon icon={ExclamationTriangleIcon} size="sm" className="mt-0.5 shrink-0" />
            <span>{t('budgets.widget.alerte')}</span>
          </div>
        )}

        {/* Top budgets */}
        {budgets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {t('budgets.widget.topBudgets')}
            </p>
            {budgets.slice(0, 3).map((budget) => {
              const taux = budget.montant_alloue > 0 
                ? (budget.montant_utilise / budget.montant_alloue) * 100 
                : 0;
              const estEpuise = budget.montant_alloue - budget.montant_utilise <= 0;
              
              return (
                <div key={budget.id_budget} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-slate-300 truncate max-w-[120px]">
                    {budget.centre_cout}
                  </span>
                  <div className="flex items-center gap-2 flex-1 ml-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-night-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${estEpuise ? 'bg-danger' : taux > 70 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(taux, 100)}%` }}
                      />
                    </div>
                    <span className={`font-medium w-12 text-right ${estEpuise ? 'text-danger' : 'text-gray-600 dark:text-slate-400'}`}>
                      {taux.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BudgetWidget;