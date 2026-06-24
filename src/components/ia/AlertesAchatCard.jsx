// frontend/src/components/ia/AlertesAchatCard.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  AppIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  XCircleIcon,
  SignalIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
  ChartBarIcon,
} from '../ui/icons';

const AlertesAchatCard = ({ alertes, onRefresh }) => {
    const { t } = useTranslation();

    if (!alertes || alertes.length === 0) return null;

    const getActionClass = (action) => {
        if (action === 'ACHAT_URGENT') return 'bg-red-50 border-red-200';
        if (action === 'SURVEILLER') return 'bg-yellow-50 border-yellow-200';
        return 'bg-gray-50 border-gray-200';
    };

    const getActionIcon = (action) => {
        if (action === 'ACHAT_URGENT') return XCircleIcon;
        if (action === 'SURVEILLER') return SignalIcon;
        return CheckCircleIcon;
    };

    const getActionLabel = (action) => {
        if (action === 'ACHAT_URGENT') return t('iaAlertesAchat.urgentPurchase');
        if (action === 'SURVEILLER') return t('iaAlertesAchat.watch');
        return t('iaAlertesAchat.ok');
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-5 border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                    <AppIcon icon={ArchiveBoxIcon} size="md" />
                    {t('iaAlertesAchat.title')}
                </h3>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="text-gray-400 hover:text-gray-600 dark:text-slate-300 text-sm"
                        title={t('iaAlertesAchat.refresh')}
                    >
                        <AppIcon icon={ArrowPathIcon} size="sm" />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {alertes.map((alerte) => {
                    const ActionIcon = getActionIcon(alerte.action);
                    return (
                        <div
                            key={alerte.piece_id}
                            className={`p-4 rounded-lg border ${getActionClass(alerte.action)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AppIcon icon={ActionIcon} size="md" />
                                        <h4 className="font-bold text-gray-800 dark:text-slate-100">
                                            {alerte.designation}
                                        </h4>
                                        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                                            {alerte.reference}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400">{t('iaAlertesAchat.currentStock')}</span>
                                            <span className={`ml-2 font-medium ${
                                                alerte.stock_actuel < alerte.stock_minimum 
                                                    ? 'text-red-600' 
                                                    : 'text-gray-800'
                                            }`}>
                                                {alerte.stock_actuel}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400">{t('iaAlertesAchat.minStock')}</span>
                                            <span className="ml-2 font-medium text-gray-800 dark:text-slate-100">
                                                {alerte.stock_minimum}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400">{t('iaAlertesAchat.monthlyConsumption')}</span>
                                            <span className="ml-2 font-medium text-gray-800 dark:text-slate-100">
                                                {alerte.consommation_mensuelle_moyenne}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400">{t('iaAlertesAchat.estimatedStock60')}</span>
                                            <span className={`ml-2 font-medium ${
                                                alerte.stock_estime_60j < 0 
                                                    ? 'text-red-600' 
                                                    : 'text-gray-800'
                                            }`}>
                                                {alerte.stock_estime_60j}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        alerte.action === 'ACHAT_URGENT' 
                                            ? 'bg-red-500 text-white' 
                                            : 'bg-yellow-500 text-white'
                                    }`}>
                                        {getActionLabel(alerte.action)}
                                    </span>
                                    {alerte.quantite_recommandee > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{t('iaAlertesAchat.recommendedQty')}</p>
                                            <p className="text-xl font-bold text-primary-600">
                                                {alerte.quantite_recommandee}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {alerte.action === 'ACHAT_URGENT' && (
                                <div className="mt-3 flex gap-2">
                                    <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 inline-flex items-center gap-1">
                                        <AppIcon icon={ShoppingCartIcon} size="xs" className="text-white" />
                                        {t('iaAlertesAchat.createNeed')}
                                    </button>
                                    <button className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm rounded-lg hover:bg-gray-200 inline-flex items-center gap-1">
                                        <AppIcon icon={ChartBarIcon} size="xs" />
                                        {t('iaAlertesAchat.viewHistory')}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                    {t('iaAlertesAchat.urgentCount', { count: alertes.filter(a => a.action === 'ACHAT_URGENT').length })}
                </p>
            </div>
        </div>
    );
};

export default AlertesAchatCard;
