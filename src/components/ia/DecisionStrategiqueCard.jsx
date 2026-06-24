// frontend/src/components/ia/DecisionStrategiqueCard.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  AppIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SignalIcon,
} from '../ui/icons';

const DecisionStrategiqueCard = ({ decision, onRefresh }) => {
    const { t } = useTranslation();

    if (!decision) return null;

    const getDecisionClass = (decisionType) => {
        if (decisionType === 'REMPLACEMENT_RECOMMANDE') return 'bg-red-50 border-red-200';
        if (decisionType === 'CONSERVATION') return 'bg-green-50 border-green-200';
        return 'bg-yellow-50 border-yellow-200';
    };

    const getDecisionIcon = (decisionType) => {
        if (decisionType === 'REMPLACEMENT_RECOMMANDE') return XCircleIcon;
        if (decisionType === 'CONSERVATION') return CheckCircleIcon;
        return SignalIcon;
    };

    const getDecisionLabel = (decisionType) => {
        if (decisionType === 'REMPLACEMENT_RECOMMANDE') return t('iaDecision.replacement');
        if (decisionType === 'CONSERVATION') return t('iaDecision.conservation');
        return decisionType;
    };

    const DecisionIcon = getDecisionIcon(decision.decision);

    return (
        <div className={`rounded-lg shadow p-6 ${getDecisionClass(decision.decision)}`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AppIcon icon={DecisionIcon} size="md" />
                    {t('iaDecision.title')}
                </h3>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="text-gray-400 hover:text-gray-600 dark:text-slate-300 text-sm"
                        title={t('iaDecision.refresh')}
                    >
                        <AppIcon icon={ArrowPathIcon} size="sm" />
                    </button>
                )}
            </div>

            <div className="mb-4 p-3 bg-white dark:bg-slate-900/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {getDecisionLabel(decision.decision)}
                </p>
                {decision.delai !== 'N/A' && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {t('iaDecision.delay', { delay: decision.delai === '6_mois' ? t('iaDecision.delay6Months') : decision.delai })}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <AppIcon icon={CurrencyDollarIcon} size="xs" />
                        {t('iaDecision.costConservation')}
                    </p>
                    <p className="text-xl font-bold text-red-600">
                        {decision.cout_conserver_annuel?.toLocaleString()} USD
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <AppIcon icon={ArrowPathIcon} size="xs" />
                        {t('iaDecision.costReplacement')}
                    </p>
                    <p className="text-xl font-bold text-green-600">
                        {decision.cout_remplacer_annuel?.toLocaleString()} USD
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <AppIcon icon={ChartBarIcon} size="xs" />
                    {t('iaDecision.potentialSaving')}
                </p>
                <p className="text-2xl font-bold text-primary-600">
                    {t('iaDecision.perYear', { value: decision.economie_annuelle?.toLocaleString() })}
                </p>
                {decision.economie_annuelle > 0 ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <AppIcon icon={CheckCircleIcon} size="xs" />
                        {t('iaDecision.replacementCheaper')}
                    </p>
                ) : decision.economie_annuelle < 0 ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AppIcon icon={ExclamationTriangleIcon} size="xs" />
                        {t('iaDecision.conservationCheaper')}
                    </p>
                ) : null}
            </div>

            {decision.raisons && decision.raisons.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                        <AppIcon icon={ClipboardDocumentListIcon} size="xs" />
                        {t('iaDecision.reasons')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-slate-300">
                        {decision.raisons.map((raison, idx) => (
                            <li key={idx}>{raison}</li>
                        ))}
                    </ul>
                </div>
            )}

            {decision.actions_suggerees && decision.actions_suggerees.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                        <AppIcon icon={BoltIcon} size="xs" />
                        {t('iaDecision.suggestedActions')}
                    </p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-slate-300">
                        {decision.actions_suggerees.map((action, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <span className="text-primary-600">→</span> {action}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <p className="text-xs text-gray-400 dark:text-slate-500 mt-4 pt-3 border-t border-gray-100">
                {t('iaDecision.generatedOn', { date: new Date(decision.date_analyse).toLocaleString() })}
            </p>
        </div>
    );
};

export default DecisionStrategiqueCard;
