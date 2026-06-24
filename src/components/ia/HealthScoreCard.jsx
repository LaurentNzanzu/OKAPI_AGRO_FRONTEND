// frontend/src/components/ia/HealthScoreCard.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  AppIcon,
  ChartBarIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SignalIcon,
} from '../ui/icons';

const HealthScoreCard = ({ healthScore, onRefresh }) => {
    const { t } = useTranslation();

    if (!healthScore) return null;

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 50) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score) => {
        if (score >= 90) return 'bg-green-100';
        if (score >= 70) return 'bg-yellow-100';
        if (score >= 50) return 'bg-orange-100';
        return 'bg-red-100';
    };

    const getScoreIcon = (score) => {
        if (score >= 90) return CheckCircleIcon;
        if (score >= 70) return SignalIcon;
        if (score >= 50) return ExclamationTriangleIcon;
        return XCircleIcon;
    };

    const getStatutLabel = (statut) => {
        const labels = {
            'EXCELLENT': t('iaHealthScore.excellent'),
            'SURVEILLE': t('iaHealthScore.surveille'),
            'CRITIQUE': t('iaHealthScore.critique'),
            'URGENT': t('iaHealthScore.urgent')
        };
        return labels[statut] || statut;
    };

    const ScoreIcon = getScoreIcon(healthScore.score);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-5 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                    <AppIcon icon={ChartBarIcon} size="md" />
                    {t('iaHealthScore.title')}
                </h3>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="text-gray-400 hover:text-gray-600 dark:text-slate-300 text-sm"
                        title={t('iaHealthScore.refresh')}
                    >
                        <AppIcon icon={ArrowPathIcon} size="sm" />
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">/100</div>
                </div>
                <div className={`px-4 py-2 rounded-full ${getScoreBgColor(healthScore.score)} inline-flex items-center gap-2`}>
                    <AppIcon icon={ScoreIcon} size="sm" />
                    <span className="font-medium">{getStatutLabel(healthScore.statut)}</span>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-slate-300 font-medium flex items-center gap-2">
                    <AppIcon icon={LightBulbIcon} size="sm" />
                    {t('iaHealthScore.recommendation')}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300">{healthScore.recommandation}</p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">{t('iaHealthScore.vnc')}</span>
                    <span className="font-medium">{healthScore.vnc?.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">{t('iaHealthScore.originValue')}</span>
                    <span className="font-medium">{healthScore.valeur_origine?.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">{t('iaHealthScore.maintenanceCost')}</span>
                    <span className="font-medium text-orange-600">{healthScore.cout_maintenance_12m?.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">{t('iaHealthScore.breakdownFreq')}</span>
                    <span className="font-medium">{t('iaHealthScore.times', { count: healthScore.frequence_pannes_12m })}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">{t('iaHealthScore.assetAge')}</span>
                    <span className="font-medium">{t('iaHealthScore.years', { count: healthScore.age_actuel_ans?.toFixed(1) })}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">{t('iaHealthScore.totalLife')}</span>
                    <span className="font-medium">{t('iaHealthScore.years', { count: healthScore.duree_vie_totale })}</span>
                </div>
            </div>

            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                            healthScore.score >= 90 ? 'bg-green-500' :
                            healthScore.score >= 70 ? 'bg-yellow-500' :
                            healthScore.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${healthScore.score}%` }}
                    ></div>
                </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                {t('iaHealthScore.lastAnalysis', { date: new Date(healthScore.date_analyse).toLocaleString() })}
            </p>
        </div>
    );
};

export default HealthScoreCard;
