import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { maintenancesService } from '../../services/maintenances';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import { getMaintenanceTypeConfig, AppIcon, ArrowLeftIcon } from '../ui/icons';

const NouvelleMaintenance = () => {
  const { t } = useTranslation();
    const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    
    const [biens, setBiens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initialisation du formulaire
    const [formData, setFormData] = useState({
        id_bien: searchParams.get('bien_id') || '',
        type_maintenance: 'PREVENTIVE',
        date_planifiee: new Date().toISOString().slice(0, 16),
        description: '',
        periodicite_jours: ''
    });

    useEffect(() => {
        loadBiens();
    }, []);

    const loadBiens = async () => {
        try {
            setLoading(true);
            const data = await biensService.getAll({ disponible_maintenance: true, limit: 100 });
            // Filtrer uniquement les biens qui ne sont pas immobilisés ou réformés (gestion majuscules/minuscules)
            const disponibles = (data.biens || []).filter(bien => {
                const etatUpper = String(bien.etat || '').toUpperCase();
                return etatUpper !== 'MAINTENANCE' && etatUpper !== 'REFORME';
            });
            setBiens(disponibles);
        } catch (err) {
            console.error('Erreur chargement biens:', err);
            setError(t('maintenances.nouvelle.errorLoadingBiens'));
        } finally {
            setLoading(false);
        }
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
            // Redirection vers le planning après succès
            navigate('/maintenances/planning');
        } catch (err) {
            setError(err.response?.data?.detail || t('maintenances.nouvelle.createError'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 text-center">{t('maintenances.nouvelle.loading')}</div>;

    return (
        <div className="app-page max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300">
                    <AppIcon icon={ArrowLeftIcon} size="md" />
                </button>
                <h1 className="text-2xl font-bold">{t('maintenances.nouvelle.title')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border space-y-4">
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg">{error}</div>}

                <div>
                    <label className="block text-sm font-medium mb-1">{t('maintenances.nouvelle.bienLabel')}</label>
                    <select
                        value={formData.id_bien}
                        onChange={e => setFormData({...formData, id_bien: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    >
                        <option value="">{t('maintenances.nouvelle.selectBien')}</option>
                        {biens.map(b => (
                            <option key={b.id_bien} value={b.id_bien}>
                                {b.marque || b.fabricant} {b.modele} - {b.type_bien}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('maintenances.nouvelle.typeLabel')}</label>
                    <select
                        value={formData.type_maintenance}
                        onChange={e => setFormData({...formData, type_maintenance: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        {Object.entries(maintenanceTypeConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('maintenances.nouvelle.dateLabel')}</label>
                    <input
                        type="datetime-local"
                        value={formData.date_planifiee}
                        onChange={e => setFormData({...formData, date_planifiee: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('maintenances.nouvelle.descriptionLabel')}</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        required
                    />
                </div>

                {formData.type_maintenance === 'PREVENTIVE' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('maintenances.nouvelle.periodiciteLabel')}</label>
                        <input
                            type="number"
                            value={formData.periodicite_jours}
                            onChange={e => setFormData({...formData, periodicite_jours: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder={t('maintenances.nouvelle.periodicitePlaceholder')}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">
                        {t('common.cancel')}
                    </button>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                        {submitting ? t('maintenances.nouvelle.submitting') : t('maintenances.nouvelle.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NouvelleMaintenance;