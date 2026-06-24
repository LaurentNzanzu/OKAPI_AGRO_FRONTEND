import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { mouvementsService } from '../../services/mouvements';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatPrice } from '../../utils/formatters';
import {
    MOUVEMENT_TYPE_CONFIG,
    StatusBadge,
    ArchiveBoxIcon,
    PlusIcon,
    AppIcon,
    MapPinIcon,
    EyeIcon,
} from '../ui/icons';

const TYPE_LABELS = MOUVEMENT_TYPE_CONFIG;

const ListeMouvements = () => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [mouvements, setMouvements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtres
    const [filters, setFilters] = useState({
        type: '',
        dateDebut: '',
        dateFin: '',
        idBien: ''
    });
    
    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchMouvements = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit,
                ...filters
            };
            const response = await mouvementsService.getAll(params);
            setMouvements(response.mouvements || []);
            setTotal(response.total || 0);
        } catch (err) {
            console.error('Erreur chargement mouvements:', err);
            setError('Impossible de charger les mouvements');
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchMouvements();
    }, [fetchMouvements]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(1); // Reset pagination
    };

    const handleClearFilters = () => {
        setFilters({ type: '', dateDebut: '', dateFin: '', idBien: '' });
        setPage(1);
    };

    const getTypeBadge = (type) => {
        const config = TYPE_LABELS[type] || { label: type, color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300', Icon: null };
        return <StatusBadge label={config.label} Icon={config.Icon} color={config.color} />;
    };

    const totalPages = Math.ceil(total / limit);

    if (loading && page === 1) {
        return <div className="text-center py-12">Chargement des mouvements...</div>;
    }

    return (
        <div className="app-page">
            {/* En-tête */}
            <PageHeader
                title="Mouvements des biens"
                subtitle="Traçabilité des transferts, cessions et affectations"
                icon={ArchiveBoxIcon}
                action={user?.role?.nom === 'ADMIN' ? (
                    <button
                        onClick={() => navigate('/mouvements/nouveau')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-flex items-center gap-2"
                    >
                        <AppIcon icon={PlusIcon} size="sm" className="text-white" />
                        Nouveau mouvement
                    </button>
                ) : null}
            />

            {/* Filtres */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                        >
                            <option value="">Tous les types</option>
                            {Object.entries(TYPE_LABELS).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date début</label>
                        <input
                            type="date"
                            value={filters.dateDebut}
                            onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date fin</label>
                        <input
                            type="date"
                            value={filters.dateFin}
                            onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">ID Bien</label>
                        <input
                            type="number"
                            value={filters.idBien}
                            onChange={(e) => handleFilterChange('idBien', e.target.value)}
                            placeholder="Ex: 123"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg mr-2"
                    >
                        Réinitialiser
                    </button>
                    <button
                        onClick={fetchMouvements}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Appliquer
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Tableau */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Bien</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Source → Destination</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Responsable</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">Raison</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mouvements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-400 dark:text-slate-500">
                                        Aucun mouvement trouvé
                                    </td>
                                </tr>
                            ) : (
                                mouvements.map((mvt) => (
                                    <tr key={mvt.id_mouvement} className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                                        <td className="px-4 py-3 text-sm">{formatDate(mvt.date_mouvement)}</td>
                                        <td className="px-4 py-3">{getTypeBadge(mvt.type_mouvement)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-medium">{mvt.bien_designation || `Bien #${mvt.id_bien}`}</div>
                                            <div className="text-xs text-gray-400 dark:text-slate-500">ID: {mvt.id_bien}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {mvt.localisation_source && (
                                                <div className="inline-flex items-center gap-1">
                                                    <AppIcon icon={MapPinIcon} size="xs" />
                                                    {mvt.localisation_source}
                                                </div>
                                            )}
                                            {mvt.localisation_destination && (
                                                <div className="text-gray-500 dark:text-slate-400">→ {mvt.localisation_destination}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {mvt.responsable_sortie || mvt.utilisateur_nom || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 line-clamp-2">
                                            {mvt.raison}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => navigate(`/mouvements/${mvt.id_mouvement}`)}
                                                className="text-primary-600 hover:text-primary-600 text-sm inline-flex items-center gap-1"
                                            >
                                                <AppIcon icon={EyeIcon} size="xs" />
                                                Voir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t">
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                            Page {page} sur {totalPages} ({total} mouvements)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="form-input"
                            >
                                ← Précédent
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="form-input"
                            >
                                Suivant →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListeMouvements;