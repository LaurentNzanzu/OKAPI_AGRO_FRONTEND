// frontend/src/components/ia/AlertesAchatPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { iaService } from '../../services/ia';
import AlertesAchatCard from './AlertesAchatCard';
import PageHeader from '../ui/PageHeader';
import {
  AppIcon,
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  SignalIcon,
} from '../ui/icons';

const AlertesAchatPage = () => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const [alertes, setAlertes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAlertes = async () => {
        try {
            setLoading(true);
            const data = await iaService.getAlertesAchat();
            setAlertes(data);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement alertes:', err);
            setError(t('iaAlertesAchat.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlertes();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="app-page max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300">
                    <AppIcon icon={ArrowLeftIcon} size="md" />
                </button>
                <div className="flex-1">
                    <PageHeader
                        title={t('iaAlertesAchat.title')}
                        subtitle={t('iaAlertesAchat.subtitle')}
                        icon={ArchiveBoxIcon}
                    />
                </div>
                <button
                    onClick={fetchAlertes}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
                >
                    <AppIcon icon={ArrowPathIcon} size="sm" />
                    {t('iaAlertesAchat.refresh')}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {alertes.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="mb-3 flex justify-center">
                        <AppIcon icon={CheckCircleIcon} size="lg" className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-semibold text-green-700 mb-2">{t('iaAlertesAchat.stockSufficient')}</h2>
                    <p className="text-green-600">
                        {t('iaAlertesAchat.noAlerts')}
                        {' '}
                        {t('iaAlertesAchat.allStockOk')}
                    </p>
                    <button
                        onClick={() => navigate('/pieces')}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                    >
                        <AppIcon icon={ArchiveBoxIcon} size="sm" className="text-white" />
                        {t('iaAlertesAchat.manageStock')}
                    </button>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm inline-flex items-center gap-1">
                            <AppIcon icon={XCircleIcon} size="xs" />
                            Urgent: {alertes.filter(a => a.action === 'ACHAT_URGENT').length}
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm inline-flex items-center gap-1">
                            <AppIcon icon={SignalIcon} size="xs" />
                            À surveiller: {alertes.filter(a => a.action === 'SURVEILLER').length}
                        </span>
                    </div>
                    <AlertesAchatCard alertes={alertes} onRefresh={fetchAlertes} />
                </>
            )}
        </div>
    );
};

export default AlertesAchatPage;
