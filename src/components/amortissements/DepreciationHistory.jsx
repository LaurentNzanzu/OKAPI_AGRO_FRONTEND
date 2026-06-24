// frontend/src/components/amortissements/DepreciationHistory.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { formatPrice, formatDate } from '../../utils/formatters';
import { AppIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowPathIcon } from '../ui/icons';
import RepriseDepreciation from './RepriseDepreciation';

const DepreciationHistory = ({ bienId, onRefresh }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [showReprise, setShowReprise] = useState(false);
    const [selectedDepreciation, setSelectedDepreciation] = useState(null);

    useEffect(() => {
        if (bienId) {
            fetchData();
        }
    }, [bienId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await amortissementsService.getDepreciations(bienId);
            setData(result);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement dépréciations:', err);
            setError(err.response?.data?.detail || t('amortissementsDepreciation.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleRepriseSuccess = () => {
        setShowReprise(false);
        setSelectedDepreciation(null);
        fetchData();
        if (onRefresh) onRefresh();
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-4 rounded-lg">
                {error}
            </div>
        );
    }

    if (!data || (data.depreciations.length === 0 && data.reprises.length === 0)) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                <AppIcon icon={ExclamationTriangleIcon} size="md" />
                <p className="mt-2">{t('amortissementsDepreciation.noData')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cumul et statut */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg">
                <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        {t('amortissementsDepreciation.cumul')}
                    </p>
                    <p className="text-xl font-bold text-primary-600">
                        {formatPrice(data.cumul_depreciation)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        {t('amortissementsDepreciation.statutComptable')}
                    </p>
                    <p className="text-lg font-medium">
                        {data.statut_comptable}
                    </p>
                </div>
            </div>

            {/* Liste des dépréciations */}
            {data.depreciations.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        {t('amortissementsDepreciation.depreciationsTitle')}
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-3 py-2 text-left">{t('amortissementsDepreciation.colDate')}</th>
                                    <th className="px-3 py-2 text-right">{t('amortissementsDepreciation.colMontant')}</th>
                                    <th className="px-3 py-2 text-right">{t('amortissementsDepreciation.colNouvelleValeur')}</th>
                                    <th className="px-3 py-2 text-center">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {data.depreciations.map((dep) => (
                                    <tr key={dep.id_amortissement} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-3 py-2">{formatDate(dep.date_depreciation)}</td>
                                        <td className="px-3 py-2 text-right text-red-600 font-medium">
                                            {formatPrice(dep.montant_depreciation)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {formatPrice(dep.valeur_actualisee)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedDepreciation(dep);
                                                    setShowReprise(true);
                                                }}
                                                className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                                            >
                                                <AppIcon icon={ArrowPathIcon} size="xs" className="text-white" />
                                                {t('amortissementsDepreciation.reprendre')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Liste des reprises */}
            {data.reprises.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        {t('amortissementsDepreciation.reprisesTitle')}
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-3 py-2 text-left">{t('amortissementsDepreciation.colDate')}</th>
                                    <th className="px-3 py-2 text-right">{t('amortissementsDepreciation.colMontant')}</th>
                                    <th className="px-3 py-2 text-left">{t('amortissementsDepreciation.colMotif')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {data.reprises.map((rep) => (
                                    <tr key={rep.id_ecriture} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                        <td className="px-3 py-2">{formatDate(rep.date_ecriture)}</td>
                                        <td className="px-3 py-2 text-right text-green-600 font-medium">
                                            {formatPrice(rep.montant)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 dark:text-slate-400">
                                            {rep.libelle}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de reprise */}
            {showReprise && (
                <RepriseDepreciation
                    bienId={bienId}
                    depreciation={selectedDepreciation}
                    onClose={() => {
                        setShowReprise(false);
                        setSelectedDepreciation(null);
                    }}
                    onSuccess={handleRepriseSuccess}
                />
            )}
        </div>
    );
};

export default DepreciationHistory;