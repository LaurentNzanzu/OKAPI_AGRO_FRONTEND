import React, { useState, useEffect } from 'react';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { validationsService } from '../../services/validations';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import { ClockIcon, CheckBadgeIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
    AppIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ArchiveBoxIcon,
    CalendarDaysIcon,
} from '../ui/icons';
import WorkflowAmortissementStepper from '../amortissements/WorkflowAmortissementStepper';

const ValidationsEnAttente = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('amortissements'); // Default to amortissements workflow
    const [besoins, setBesoins] = useState([]);
    const [amortissements, setAmortissements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    // frontend/src/pages/ValidationsEnAttente.jsx
    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Appel API simple
            const resAmort = await api.get('/amortissements');

            // 2. Nettoyage des données (Sécurisation contre les valeurs non-numériques)
            const data = resAmort.data || [];
            const sanitizedData = data.map(item => ({
                ...item,
                // Force la conversion en nombre pour éviter l'erreur float_type
                annuite_comptable: parseFloat(item.annuite_comptable) || 0
            }));

            setAmortissements(sanitizedData);

            // 3. Chargement des besoins
            const dataBesoins = await validationsService.getEnAttente();
            setBesoins(dataBesoins.filter((b) => b.statut !== 'ATTENTE_STOCK'));

        } catch (err) {
            console.error("Erreur API détaillée:", err.response?.data);
            setError("Impossible de charger les données : format de nombre invalide reçu du serveur.");
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = () => {
        const role = user?.role?.nom?.toUpperCase();
        const labels = {
            'DG': t('validationDG') || 'Direction Générale',
            'COMPTABLE': t('validationAccounting') || 'Comptabilité',
            'CAISSE': t('validationCashier') || 'Responsable Caisse',
        };
        return labels[role] || (user?.role?.nom || 'Validateur');
    };

    const totalMontantBesoins = besoins.reduce((sum, b) => sum + (b.montant_total || 0), 0);
    const totalMontantAmort = amortissements.reduce((sum, a) => sum + (a.annuite_comptable || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <AppPage>
            <PageHeader
                title={t('pendingValidations') || "Validations en attente"}
                subtitle={`Connecté en tant que : ${getRoleLabel()}`}
                icon={CheckBadgeIcon}
            />

            <div className="app-stats-grid mb-6">
                <StatCard label="Workflow Amortissements" value={amortissements.length} icon={ShieldCheckIcon} />
                <StatCard label="Demandes de Besoins" value={besoins.length} icon={ClockIcon} />
                <StatCard label="Total Engagé (Amort.)" value={`${formatPrice(totalMontantAmort)}`} icon={BanknotesIcon} />
            </div>

            {/* Onglets de Navigation */}
            <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-slate-800 mb-6 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm gap-2">
                <button
                    onClick={() => setActiveTab('amortissements')}
                    className={`w-full sm:flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'amortissements'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Workflow Amortissements ({amortissements.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('besoins')}
                    className={`w-full sm:flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'besoins'
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <ClockIcon className="w-5 h-5" />
                    <span>Demandes & Pièces ({besoins.length})</span>
                </button>
            </div>

            {error && <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

            {/* Contenu Onglet Amortissements */}
            {activeTab === 'amortissements' && (
                <div className="space-y-6">
                    {amortissements.length === 0 ? (
                        <Card>
                            <p className="text-center text-gray-500 dark:text-slate-400 py-8">Aucun amortissement enregistré dans le workflow.</p>
                        </Card>
                    ) : (
                        amortissements.map((amort) => (
                            <div key={amort.id_amortissement} className="space-y-2">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-lg text-xs text-gray-600 dark:text-slate-300 font-medium">
                                    <span>Amortissement #{amort.id_amortissement} | Exercice {amort.exercice} | Méthode: {amort.methode}</span>
                                    <span className="font-bold text-primary-600">{formatPrice(amort.annuite_comptable)}</span>
                                </div>
                                <WorkflowAmortissementStepper
                                    idAmortissement={amort.id_amortissement}
                                    onWorkflowUpdate={fetchAllData}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Contenu Onglet Besoins */}
            {activeTab === 'besoins' && (
                <div>
                    {besoins.length === 0 ? (
                        <Card>
                            <p className="text-center text-gray-500 dark:text-slate-400 py-8">{t('noPendingValidation') || "Aucune validation de besoin en attente"}</p>
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
                </div>
            )}
        </AppPage>
    );
};

export default ValidationsEnAttente;
