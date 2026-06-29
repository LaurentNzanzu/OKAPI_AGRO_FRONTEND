// frontend/src/components/amortissements/DashboardAmortissement.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { formatPrice } from '../../utils/formatters';
import { AppIcon, ChartBarIcon, ExclamationTriangleIcon, ClockIcon, CalculatorIcon, CurrencyDollarIcon } from '../ui/icons';

const CarteIndicateur = ({ title, value, icon, color, subtitle }) => {
    const colorClasses = {
        primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-300',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300'
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-border-light dark:border-border-dark p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.primary}`}>
                    <AppIcon icon={icon} size="md" />
                </div>
            </div>
        </div>
    );
};

const DashboardAmortissement = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const result = await amortissementsService.getDashboard();
            setData({
                total_amortissements_exercice: result?.total_amortissements_exercice || 0,
                ecart_fiscal_total: result?.ecart_fiscal_total || 0,
                biens_fin_vie: result?.biens_fin_vie || 0,
                ecritures_attente_validation: result?.ecritures_attente_validation || 0,
                economie_impot_annuelle: result?.economie_impot_annuelle || 0,
                repartition_par_categorie: result?.repartition_par_categorie || {},
                annee_courante: result?.annee_courante || new Date().getFullYear()
            });
            setError(null);
        } catch (err) {
            console.warn('Chargement des indicateurs amortissements limité:', err);
            setData({
                total_amortissements_exercice: 0,
                ecart_fiscal_total: 0,
                biens_fin_vie: 0,
                ecritures_attente_validation: 0,
                economie_impot_annuelle: 0,
                repartition_par_categorie: {},
                annee_courante: new Date().getFullYear()
            });
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                {t('amortissementsDashboard.noData')}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Grille 2x2 des indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* A : Total amortissements */}
                <CarteIndicateur
                    title={t('amortissementsDashboard.totalAmortissements')}
                    value={formatPrice(data.total_amortissements_exercice)}
                    icon={CalculatorIcon}
                    color="primary"
                    subtitle={`${t('amortissementsDashboard.exercice')} ${data.annee_courante}`}
                />

                {/* B : Écart fiscal */}
                <CarteIndicateur
                    title={t('amortissementsDashboard.ecartFiscal')}
                    value={formatPrice(data.ecart_fiscal_total)}
                    icon={ChartBarIcon}
                    color="yellow"
                />

                {/* C : Biens en fin de vie */}
                <CarteIndicateur
                    title={t('amortissementsDashboard.biensFinVie')}
                    value={data.biens_fin_vie}
                    icon={ExclamationTriangleIcon}
                    color="red"
                />

                {/* D : Écritures en attente */}
                <CarteIndicateur
                    title={t('amortissementsDashboard.ecrituresAttente')}
                    value={data.ecritures_attente_validation}
                    icon={ClockIcon}
                    color="blue"
                />
            </div>

            {/* Économie d'impôt - pleine largeur */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            {t('amortissementsDashboard.economieImpot')}
                        </p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {formatPrice(data.economie_impot_annuelle)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                            {t('amortissementsDashboard.economieImpotSubtitle')}
                        </p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300">
                        <AppIcon icon={CurrencyDollarIcon} size="md" />
                    </div>
                </div>
            </div>

            {/* Répartition par catégorie */}
            {data.repartition_par_categorie && Object.keys(data.repartition_par_categorie).length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-border-light dark:border-border-dark p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        {t('amortissementsDashboard.repartitionCategorie')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(data.repartition_par_categorie).map(([categorie, count]) => {
                            // Traduction des catégories
                            const categoryKey = categorie === 'vehicule' ? 'vehicle' : categorie;
                            const categoryLabel = t(`categories.${categoryKey}`, categorie);
                            return (
                                <span key={categorie} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full text-sm">
                                    {categoryLabel}: {count}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardAmortissement;