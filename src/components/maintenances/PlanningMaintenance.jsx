import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useNavigate } from 'react-router-dom';
import { maintenancesService } from '../../services/maintenances';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatPrice } from '../../utils/formatters';
import {
    AppIcon,
    getMaintenanceTypeConfig,
    getMaintenanceStatutConfig,
    StatusBadge,
    WrenchScrewdriverIcon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon,
    UserIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    CheckCircleIcon,
    PlayIcon,
    CurrencyDollarIcon,
    PencilSquareIcon,
    BellAlertIcon,
} from '../ui/icons';

const PlanningMaintenance = () => {
  const { t } = useTranslation();
    const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);
    const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [maintenances, setMaintenances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        id_bien: '',
        type_maintenance: 'PREVENTIVE',
        date_planifiee: '',
        description: '',
        periodicite_jours: null
    });
    const [biens, setBiens] = useState([]);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const FILTER_LABELS = useMemo(() => ({
        all: { label: t('maintenances.planning.filterAll'), Icon: ClipboardDocumentListIcon },
        'a-venir': { label: t('maintenances.planning.filterAVenir'), Icon: CalendarDaysIcon },
        'en-retard': { label: t('maintenances.planning.filterEnRetard'), Icon: ExclamationTriangleIcon },
        mes: { label: t('maintenances.planning.filterMes'), Icon: UserIcon },
    }), [t]);

    const getTypeInfo = (type) => maintenanceTypeConfig[type] || maintenanceTypeConfig.PREVENTIVE;
    const getStatutInfo = (statut) => maintenanceStatutConfig[statut] || maintenanceStatutConfig.PLANIFIEE;

    const fetchMaintenances = useCallback(async () => {
        try {
            setLoading(true);
            let data;
            
            if (filter === 'a-venir') {
                data = await maintenancesService.getAVenir();
            } else if (filter === 'en-retard') {
                data = await maintenancesService.getEnRetard();
            } else if (filter === 'mes') {
                data = await maintenancesService.getMesMaintenances();
            } else {
                const biensData = await biensService.getAll({ limit: 100 });
                const allMaintenances = [];
                for (const bien of (biensData.biens || [])) {
                    try {
                        const maints = await maintenancesService.getByBienId(bien.id_bien);
                        allMaintenances.push(...maints);
                    } catch (e) {}
                }
                data = allMaintenances;
            }
            
            const filtered = searchTerm ? data.filter(m =>
                m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.bien_designation?.toLowerCase().includes(searchTerm.toLowerCase())
            ) : data;
            
            setMaintenances(filtered || []);
        } catch (err) {
            console.error('Erreur chargement maintenances:', err);
            setError(t('maintenances.planning.loadError'));
        } finally {
            setLoading(false);
        }
    }, [filter, searchTerm]);

    useEffect(() => {
        fetchMaintenances();
    }, [fetchMaintenances]);

    const loadBiens = async () => {
        try {
            const data = await biensService.getAll({ limit: 500 });
            setBiens(data.biens || []);
        } catch (err) {
            console.error('Erreur chargement biens:', err);
        }
    };

    const handleOpenForm = () => {
        loadBiens();
        setFormData({
            id_bien: '',
            type_maintenance: 'PREVENTIVE',
            date_planifiee: new Date().toISOString().slice(0, 16),
            description: '',
            periodicite_jours: null
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        
        try {
            await maintenancesService.create({
                id_bien: parseInt(formData.id_bien),
                type_maintenance: formData.type_maintenance,
                date_planifiee: new Date(formData.date_planifiee).toISOString(),
                description: formData.description,
                periodicite_jours: formData.periodicite_jours ? parseInt(formData.periodicite_jours) : null
            });
            setShowForm(false);
            fetchMaintenances();
        } catch (err) {
        // ✅ Gestion robuste des erreurs FastAPI
        let errorMsg = t('maintenances.planning.planError');
        
        if (err.response?.status === 422 && Array.isArray(err.response.data?.detail)) {
            // FastAPI retourne un tableau d'erreurs de validation
            errorMsg = err.response.data.detail
                .map(e => {
                    const field = e.loc?.slice(1)?.join('.') || t('common.errors.field');
                    return `${field}: ${e.msg}`;
                })
                .join('; ');
        } else if (err.response?.data?.detail) {
            errorMsg = typeof err.response.data.detail === 'string' 
                ? err.response.data.detail 
                : JSON.stringify(err.response.data.detail);
        } else if (err.message) {
            errorMsg = err.message;
        }
        
        setError(errorMsg);
        console.error('Erreur création maintenance:', err);
        }
    };

    const joursRestants = (datePlanifiee) => {
        const diff = new Date(datePlanifiee) - new Date();
        const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (jours < 0) return { text: t('maintenances.planning.late'), isLate: true };
        if (jours === 0) return { text: t('maintenances.planning.today'), isToday: true };
        return { text: t('maintenances.planning.daysRemaining', { count: jours }), isLate: false, isToday: false };
    };

    if (loading) {
        return <div className="text-center py-12">{t('maintenances.planning.loading')}</div>;
    }

    return (
        <div className="app-page">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold inline-flex items-center gap-2">
                        <AppIcon icon={WrenchScrewdriverIcon} size="md" />
                        {t('maintenances.planning.title')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        {t('maintenances.planning.subtitle')}
                    </p>
                </div>
                {user?.roles?.includes('TECHNICIEN') && (
                    <button
                        onClick={handleOpenForm}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-flex items-center gap-1.5"
                    >
                        <AppIcon icon={PlusIcon} size="sm" className="text-white" />
                        {t('maintenances.planning.newMaintenance')}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'a-venir', 'en-retard', 'mes'].map(f => {
                        const filterInfo = FILTER_LABELS[f];
                        return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-1.5 ${
                                filter === f
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {filterInfo && <AppIcon icon={filterInfo.Icon} size="xs" className={filter === f ? 'text-white' : ''} />}
                            {filterInfo?.label}
                        </button>
                        );
                    })}
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                        <AppIcon icon={MagnifyingGlassIcon} size="sm" />
                    </span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>
            )}

            {maintenances.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-gray-500 dark:text-slate-400">{t('maintenances.planning.empty')}</p>
                    <button
                        onClick={handleOpenForm}
                        className="text-primary-500 mt-2 inline-block"
                    >
                        {t('maintenances.planning.planAction')}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {maintenances.map(m => {
                        const typeInfo = getTypeInfo(m.type_maintenance);
                        const statutInfo = getStatutInfo(m.statut);
                        const reste = joursRestants(m.date_planifiee);
                        
                        return (
                            <div
                                key={m.id_maintenance}
                                className="bg-white dark:bg-slate-900 border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/maintenances/${m.id_maintenance}`)}
                            >
                                <div className="flex flex-wrap justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusBadge label={typeInfo.label} Icon={typeInfo.Icon} color={typeInfo.color} />
                                            <StatusBadge label={statutInfo.label} Icon={statutInfo.Icon} color={statutInfo.color} />
                                            {reste && m.statut === 'PLANIFIEE' && (
                                                <span className={`text-xs inline-flex items-center gap-1 ${reste.isLate ? 'text-red-500' : 'text-primary-600'}`}>
                                                    {reste.isLate && <AppIcon icon={ExclamationTriangleIcon} size="xs" />}
                                                    {reste.isToday && <AppIcon icon={BellAlertIcon} size="xs" />}
                                                    {reste.text}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-medium">{m.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {t('maintenances.planning.bien')} {m.bien_designation || `ID: ${m.id_bien}`}
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                                <AppIcon icon={CalendarDaysIcon} size="xs" />
                                                {t('maintenances.planning.planned')} {formatDate(m.date_planifiee)}
                                            </span>
                                            {m.date_debut_reelle && (
                                                <span className="inline-flex items-center gap-1">
                                                    <AppIcon icon={PlayIcon} size="xs" />
                                                    {t('maintenances.planning.start')} {formatDate(m.date_debut_reelle)}
                                                </span>
                                            )}
                                            {m.date_fin_reelle && (
                                                <span className="inline-flex items-center gap-1">
                                                    <AppIcon icon={CheckCircleIcon} size="xs" />
                                                    {t('maintenances.planning.end')} {formatDate(m.date_fin_reelle)}
                                                </span>
                                            )}
                                            {m.cout > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <AppIcon icon={CurrencyDollarIcon} size="xs" />
                                                    {formatPrice(m.cout)}
                                                </span>
                                            )}
                                        </div>
                                        {m.observation && (
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 inline-flex items-center gap-1">
                                                <AppIcon icon={PencilSquareIcon} size="xs" />
                                                {m.observation}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 dark:text-slate-500">
                                            #{m.id_maintenance}
                                        </div>
                                        {m.jours_restants > 0 && m.statut === 'PLANIFIEE' && (
                                            <div className="mt-1 text-sm font-medium text-primary-500">
                                                {m.jours_restants}j
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">{t('maintenances.planning.modalTitle')}</h3>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('maintenances.planning.typeLabel')}
                                </label>
                                <select
                                    value={formData.type_maintenance}
                                    onChange={(e) => setFormData({ ...formData, type_maintenance: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                >
                                    {Object.entries(maintenanceTypeConfig).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('maintenances.planning.bienLabel')}
                                </label>
                                <select
                                    value={formData.id_bien}
                                    onChange={(e) => setFormData({ ...formData, id_bien: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                >
                                    <option value="">{t('maintenances.planning.selectBien')}</option>
                                    {biens.map(b => (
                                        <option key={b.id_bien} value={b.id_bien}>
                                            {b.marque || b.fabricant} {b.modele || ''} - {b.type_bien}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('maintenances.planning.dateLabel')}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.date_planifiee}
                                    onChange={(e) => setFormData({ ...formData, date_planifiee: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('maintenances.planning.descriptionLabel')}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                    placeholder={t('maintenances.planning.descriptionPlaceholder')}
                                />
                            </div>
                            {formData.type_maintenance === 'PREVENTIVE' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        {t('maintenances.planning.periodiciteLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.periodicite_jours || ''}
                                        onChange={(e) => setFormData({ ...formData, periodicite_jours: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                        placeholder={t('maintenances.planning.periodicitePlaceholder')}
                                    />
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                        {t('maintenances.planning.periodiciteHint')}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    {submitting ? t('maintenances.planning.submitting') : (
                                        <>
                                            <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />
                                            {t('maintenances.planning.submit')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningMaintenance;