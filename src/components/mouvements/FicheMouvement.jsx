import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useParams, useNavigate } from 'react-router-dom';
import { mouvementsService } from '../../services/mouvements';
import { formatDate } from '../../utils/formatters';
import {
  MOUVEMENT_TYPE_CONFIG,
  StatusBadge,
  AppIcon,
  ArrowLeftIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  ArrowRightCircleIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  EyeIcon,
  ClipboardDocumentListIcon as HistoriqueIcon,
} from '../ui/icons';

const FicheMouvement = () => {
  const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [mouvement, setMouvement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMouvement();
    }, [id]);

    const fetchMouvement = async () => {
        try {
            setLoading(true);
            const data = await mouvementsService.getById(id);
            setMouvement(data);
        } catch (err) {
            console.error('Erreur chargement mouvement:', err);
            setError('Impossible de charger les détails du mouvement');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadJustificatif = () => {
        if (mouvement?.piece_justificative) {
            window.open(mouvement.piece_justificative, '_blank');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Chargement...</div>;
    }

    if (error || !mouvement) {
        return (
            <div className="app-page max-w-4xl mx-auto w-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold text-red-700 mb-2">{error || 'Mouvement non trouvé'}</h2>
                    <button onClick={() => navigate('/mouvements/liste')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2">
                        <AppIcon icon={ArrowLeftIcon} size="sm" className="text-white" />
                        Retour aux mouvements
                    </button>
                </div>
            </div>
        );
    }

    const typeConfig = MOUVEMENT_TYPE_CONFIG[mouvement.type_mouvement] || MOUVEMENT_TYPE_CONFIG.TRANSFERT;

    return (
        <div className="app-page max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/mouvements/liste')} className="text-gray-500 hover:text-gray-700 dark:text-slate-300">
                        <AppIcon icon={ArrowLeftIcon} size="md" />
                    </button>
                    <div className="flex items-center gap-2">
                        <AppIcon icon={typeConfig.Icon} size="lg" className="text-primary-600" />
                        <div>
                            <h1 className="text-2xl font-bold">
                                Mouvement #{mouvement.id_mouvement}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Créé le {formatDate(mouvement.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
                <StatusBadge label={typeConfig.label} Icon={typeConfig.Icon} color={typeConfig.color} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <AppIcon icon={ArchiveBoxIcon} size="sm" />
                            Bien concerné
                        </h3>
                        <div className="space-y-2">
                            <p className="font-medium">{mouvement.bien_designation || `Bien #${mouvement.id_bien}`}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">ID: {mouvement.id_bien}</p>
                            <button
                                onClick={() => navigate(`/biens/${mouvement.id_bien}`)}
                                className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                            >
                                Voir la fiche du bien →
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <AppIcon icon={ClipboardDocumentListIcon} size="sm" />
                            Détails du mouvement
                        </h3>
                        <div className="app-page">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Date du mouvement</p>
                                    <p className="font-medium">{formatDate(mouvement.date_mouvement)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Créé par</p>
                                    <p className="font-medium">{mouvement.utilisateur_nom || `Utilisateur #${mouvement.id}`}</p>
                                </div>
                            </div>

                            {(mouvement.localisation_source || mouvement.localisation_destination) && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Trajet</p>
                                    <div className="flex items-center gap-2">
                                        {mouvement.localisation_source && (
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-sm inline-flex items-center gap-1">
                                                <AppIcon icon={MapPinIcon} size="xs" />
                                                {mouvement.localisation_source}
                                            </span>
                                        )}
                                        {mouvement.localisation_source && mouvement.localisation_destination && (
                                            <span className="text-gray-400 dark:text-slate-500">→</span>
                                        )}
                                        {mouvement.localisation_destination && (
                                            <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded text-sm inline-flex items-center gap-1">
                                                <AppIcon icon={ArrowRightCircleIcon} size="xs" />
                                                {mouvement.localisation_destination}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Raison</p>
                                <p className="text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">{mouvement.raison}</p>
                            </div>

                            {mouvement.responsable_sortie && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Responsable de la sortie</p>
                                    <p className="font-medium">{mouvement.responsable_sortie}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {mouvement.piece_justificative && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                            <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <AppIcon icon={PaperClipIcon} size="sm" />
                                Pièce justificative
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">{mouvement.piece_justificative.split('/').pop()}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">Document justificatif</p>
                                </div>
                                <button
                                    onClick={handleDownloadJustificatif}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm inline-flex items-center gap-2"
                                >
                                    <AppIcon icon={ArrowDownTrayIcon} size="sm" className="text-white" />
                                    Télécharger
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="app-page">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <AppIcon icon={MagnifyingGlassIcon} size="sm" />
                            Traçabilité
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">ID Mouvement</span>
                                <span className="font-mono">#{mouvement.id_mouvement}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">ID Bien</span>
                                <span className="font-mono">#{mouvement.id_bien}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">ID Utilisateur</span>
                                <span className="font-mono">#{mouvement.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">Type</span>
                                <span>{mouvement.type_mouvement}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">Créé le</span>
                                <span>{formatDate(mouvement.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <AppIcon icon={BoltIcon} size="sm" />
                            Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate(`/biens/${mouvement.id_bien}`)}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 text-sm inline-flex items-center justify-center gap-2"
                            >
                                <AppIcon icon={EyeIcon} size="sm" />
                                Voir le bien
                            </button>
                            <button
                                onClick={() => navigate(`/mouvements/historique?bien_id=${mouvement.id_bien}`)}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 text-sm inline-flex items-center justify-center gap-2"
                            >
                                <AppIcon icon={HistoriqueIcon} size="sm" />
                                Historique complet
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FicheMouvement;
