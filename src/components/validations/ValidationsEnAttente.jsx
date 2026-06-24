import React, { useState, useEffect } from 'react';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { validationsService } from '../../services/validations';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import { ClockIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import {
    AppIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ArchiveBoxIcon,
    CalendarDaysIcon,
} from '../ui/icons';

const ValidationsEnAttente = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [besoins, setBesoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBesoins();
    }, []);

    const fetchBesoins = async () => {
        try {
            setLoading(true);
            const data = await validationsService.getEnAttente();
            setBesoins(data.filter((b) => b.statut !== 'ATTENTE_STOCK'));
        } catch (err) {
            setError(t('validationsLoadError'));
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = () => {
        const role = user?.role?.nom?.toUpperCase();
        const labels = {
            'DG': t('validationDG'),
            'COMPTABLE': t('validationAccounting'),
            'CAISSE': t('validationCashier'),
        };
        return labels[role] || t('validationDefault');
    };

    const totalMontant = besoins.reduce((sum, b) => sum + (b.montant_total || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petrol"></div>
            </div>
        );
    }

    return (
        <AppPage>
            <PageHeader
                title={t('pendingValidations')}
                subtitle={getRoleLabel()}
                icon={CheckBadgeIcon}
            />

            <div className="app-stats-grid">
                <StatCard label={t('pendingRequests')} value={besoins.length} icon={ClockIcon} />
                <StatCard label={t('totalAmount')} value={formatPrice(totalMontant)} icon={CurrencyDollarIcon} />
            </div>

            {error && <div className="alert-error">{error}</div>}

            {besoins.length === 0 ? (
                <Card>
                    <p className="text-center text-gray-500 dark:text-slate-400 py-8">{t('noPendingValidation')}</p>
                </Card>
            ) : (
                <div className="flex flex-col gap-4">
                    {besoins.map(besoin => (
                        <div
                            key={besoin.id_besoin}
                            className="app-card app-card-body hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/validations/${besoin.id_besoin}`)}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                                            Demande {besoin.numero_demande}
                                        </h3>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-petrol dark:bg-primary-900/40 dark:text-primary-200">
                                            {besoin.statut}
                                        </span>
                                    </div>

                                    {besoin.bien_designation && (
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 inline-flex items-center gap-1">
                                            <AppIcon icon={MapPinIcon} size="xs" />
                                            {besoin.bien_designation}
                                        </p>
                                    )}

                                    {besoin.panne_description && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-2">
                                            {besoin.panne_description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <AppIcon icon={CalendarDaysIcon} size="xs" />
                                            {formatDate(besoin.date_creation)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <AppIcon icon={CurrencyDollarIcon} size="xs" />
                                            {formatPrice(besoin.montant_total)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <AppIcon icon={ArchiveBoxIcon} size="xs" />
                                            {besoin.nombre_lignes} pièce(s)
                                        </span>
                                    </div>
                                </div>

                                <div className="text-left sm:text-right shrink-0">
                                    <div className="text-lg font-bold text-petrol">
                                        {formatPrice(besoin.montant_total)}
                                    </div>
                                    <span className="text-sm text-petrol hover:text-petrol-dark mt-2 inline-block">
                                        Voir détails →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppPage>
    );
};

export default ValidationsEnAttente;
