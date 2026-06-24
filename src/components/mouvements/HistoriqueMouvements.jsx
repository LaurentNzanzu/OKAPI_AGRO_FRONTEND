import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { mouvementsService } from '../../services/mouvements';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';
import {
    MOUVEMENT_TYPE_CONFIG,
    StatusBadge,
    AppIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
    ArrowRightCircleIcon,
    PaperClipIcon,
    PlusIcon,
} from '../ui/icons';

const TYPE_BADGE = Object.fromEntries(
    Object.entries(MOUVEMENT_TYPE_CONFIG).map(([key, config]) => [key, { ...config, desc: config.label }])
);

const HistoriqueMouvements = ({ bienId, readOnly = false }) => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, canCreateMouvementType } = useAuth();
    
    const [mouvements, setMouvements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (bienId) {
            fetchHistorique();
        }
    }, [bienId]);

    const fetchHistorique = async () => {
        try {
            setLoading(true);
            const data = await mouvementsService.getByBien(bienId);
            setMouvements(data || []);
        } catch (err) {
            console.error('Erreur chargement historique mouvements:', err);
            setError('Impossible de charger l\'historique');
        } finally {
            setLoading(false);
        }
    };

    const handleNouveauMouvement = () => {
        navigate(`/mouvements/nouveau?bien_id=${bienId}`);
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-400 dark:text-slate-500">Chargement de l'historique...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500 text-sm">{error}</div>;
    }

    if (mouvements.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Aucun mouvement enregistré pour ce bien</p>
                {!readOnly && !loading && (
                    <button
                        onClick={handleNouveauMouvement}
                        className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50 inline-flex items-center gap-2"
                        disabled={!canCreateMouvementType('TRANSFERT')}
                    >
                        <AppIcon icon={PlusIcon} size="sm" className="text-white" />
                        Enregistrer un mouvement
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <AppIcon icon={ClipboardDocumentListIcon} size="sm" />
                    Historique des mouvements
                </h4>
                <span className="text-xs text-gray-400 dark:text-slate-500">{mouvements.length} mouvement(s)</span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {mouvements.map((mvt) => {
                    const badge = TYPE_BADGE[mvt.type_mouvement] || TYPE_BADGE.TRANSFERT;
                    return (
                        <div
                            key={mvt.id_mouvement}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-gray-100"
                            onClick={() => navigate(`/mouvements/${mvt.id_mouvement}`)}
                        >
                            <StatusBadge label={badge.desc} Icon={badge.Icon} color={badge.color} iconSize="xs" />
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm text-gray-700 dark:text-slate-300">{mvt.raison}</span>
                                    <span className="text-xs text-gray-400 dark:text-slate-500">•</span>
                                    <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(mvt.date_mouvement)}</span>
                                </div>
                                
                                {(mvt.localisation_source || mvt.localisation_destination) && (
                                    <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                        {mvt.localisation_source && (
                                            <span className="inline-flex items-center gap-1">
                                                <AppIcon icon={MapPinIcon} size="xs" />
                                                {mvt.localisation_source}
                                            </span>
                                        )}
                                        {mvt.localisation_source && mvt.localisation_destination && <span>→</span>}
                                        {mvt.localisation_destination && (
                                            <span className="inline-flex items-center gap-1">
                                                <AppIcon icon={ArrowRightCircleIcon} size="xs" />
                                                {mvt.localisation_destination}
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {mvt.responsable_sortie && (
                                    <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                        Resp: {mvt.responsable_sortie}
                                    </div>
                                )}
                                
                                {mvt.piece_justificative && (
                                    <div className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                                        <AppIcon icon={PaperClipIcon} size="xs" />
                                        Justificatif
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-right">
                                <span className="text-gray-400 dark:text-slate-500 text-xs block">#{mvt.id_mouvement}</span>
                                <span className="text-gray-400 dark:text-slate-500 text-sm">→</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
                <button
                    onClick={() => navigate(`/mouvements/historique?bien_id=${bienId}`)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Voir l'historique complet →
                </button>
                
                {!readOnly && (
                    <button
                        onClick={handleNouveauMouvement}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50 inline-flex items-center gap-1"
                        disabled={!canCreateMouvementType('TRANSFERT')}
                        title={!canCreateMouvementType('TRANSFERT') ? "Permissions insuffisantes" : ""}
                    >
                        <AppIcon icon={PlusIcon} size="xs" className="text-white" />
                        Nouveau
                    </button>
                )}
            </div>
        </div>
    );
};

export default HistoriqueMouvements;
