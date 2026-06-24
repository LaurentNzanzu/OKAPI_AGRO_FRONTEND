import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mouvementsService } from '../../services/mouvements';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import {
  MOUVEMENT_TYPE_CONFIG,
  AppIcon,
  ArrowLeftIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '../ui/icons';

const TYPE_CARD_COLORS = {
  TRANSFERT: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-200',
  SORTIE: 'bg-orange-50 text-orange-700 border-orange-200',
  CESSION: 'bg-red-50 text-red-700 border-red-200',
  AFFECTATION: 'bg-purple-50 text-purple-700 border-purple-200',
  RETOUR: 'bg-green-50 text-green-700 border-green-200',
};

const TYPE_DESCRIPTIONS = {
  TRANSFERT: 'Changement de localisation',
  SORTIE: 'Sortie temporaire du parc',
  CESSION: 'Vente ou donation (réforme)',
  AFFECTATION: 'Attribution à un utilisateur',
  RETOUR: 'Retour au parc après sortie',
};

const TYPE_OPTIONS = Object.entries(MOUVEMENT_TYPE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  description: TYPE_DESCRIPTIONS[value],
  color: TYPE_CARD_COLORS[value],
  Icon: config.Icon,
}));

const NouveauMouvement = () => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bienIdFromUrl = searchParams.get('bien_id');
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        id_bien: bienIdFromUrl || '',
        type_mouvement: '',
        date_mouvement: new Date().toISOString().slice(0, 16),
        localisation_source: '',
        localisation_destination: '',
        responsable_sortie: '',
        raison: '',
        piece_justificative: ''
    });

    const [bien, setBien] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const allowedTypes = React.useMemo(() => {
        const role = user?.role?.nom?.toUpperCase();
        if (['ADMIN', 'DG', 'ADMINISTRATEUR'].includes(role)) return TYPE_OPTIONS;
        if (role === 'COMPTABLE') return TYPE_OPTIONS.filter(t => ['CESSION', 'SORTIE'].includes(t.value));
        if (role === 'TECHNICIEN') return TYPE_OPTIONS.filter(t => ['TRANSFERT', 'AFFECTATION', 'RETOUR'].includes(t.value));
        return TYPE_OPTIONS;
    }, [user]);

    useEffect(() => {
        if (bienIdFromUrl) loadBien(bienIdFromUrl);
    }, [bienIdFromUrl]);

    const loadBien = async (id) => {
        try {
            const data = await biensService.getById(id);
            setBien(data);
            setFormData(prev => ({ ...prev, id_bien: id }));
        } catch (err) {
            setError("Bien non trouvé");
        }
    };

    const searchBiens = async (term) => {
        if (!term || term.length < 2) return;
        try {
            const response = await biensService.getAll({ search: term, limit: 10 });
            setSearchResults(response.biens || []);
        } catch (err) {
            console.error('Erreur recherche:', err);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.id_bien || !formData.type_mouvement || !formData.raison) {
            setError("Veuillez remplir tous les champs obligatoires");
            return;
        }

        if (['CESSION', 'SORTIE'].includes(formData.type_mouvement) && !formData.responsable_sortie) {
            setError("Le responsable de sortie est obligatoire pour une cession ou sortie");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // ✅ Préparer les données au format attendu par le backend
            const payload = {
                id_bien: parseInt(formData.id_bien),
                type_mouvement: formData.type_mouvement,
                date_mouvement: formData.date_mouvement,
                localisation_source: formData.localisation_source || null,
                localisation_destination: formData.localisation_destination || null,
                responsable_sortie: formData.responsable_sortie || null,
                raison: formData.raison,
                piece_justificative: formData.piece_justificative || null
            };
            
            await mouvementsService.create(payload);
            navigate('/mouvements/liste');
        } catch (err) {
            console.error('Erreur complète:', err);
            console.error('Réponse erreur:', err.response?.data);
            
            // ✅ Gérer correctement l'erreur de validation
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    const messages = detail.map(d => `${d.loc.join('.')}: ${d.msg}`);
                    setError(messages.join(', '));
                } else if (typeof detail === 'string') {
                    setError(detail);
                } else {
                    setError(JSON.stringify(detail));
                }
            } else {
                setError("Erreur lors de la création du mouvement");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'type_mouvement') {
            if (!['CESSION', 'SORTIE'].includes(value)) {
                setFormData(prev => ({ ...prev, responsable_sortie: '', piece_justificative: '' }));
            }
        }
    };

    const showJustificatifs = ['CESSION', 'SORTIE'].includes(formData.type_mouvement);

    return (
        <div className="app-page max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition">
                    <AppIcon icon={ArrowLeftIcon} size="md" />
                    <span className="sr-only">Retour</span>
                </button>
                <div className="flex items-center gap-3">
                    <AppIcon icon={ArchiveBoxIcon} size="lg" className="text-primary-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Nouveau mouvement</h1>
                        <p className="text-gray-500 dark:text-slate-400">Enregistrez un déplacement, une sortie ou une affectation de bien</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="app-page">
                
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AppIcon icon={MapPinIcon} size="md" className="text-primary-600" />
                        1. Bien concerné
                    </h3>
                    
                    {!bien ? (
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher par marque, modèle ou ID..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); searchBiens(e.target.value); }}
                                className="w-full pl-4 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map(b => (
                                        <button
                                            key={b.id_bien}
                                            type="button"
                                            onClick={() => {
                                                setBien(b);
                                                setFormData(prev => ({ ...prev, id_bien: b.id_bien }));
                                                setSearchResults([]);
                                                setSearchTerm('');
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800 border-b last:border-b-0 transition"
                                        >
                                            <div className="font-bold">{b.marque || b.fabricant} {b.modele || ''}</div>
                                            <div className="text-sm text-gray-500 dark:text-slate-400">{b.type_bien} • {b.localisation || 'N/A'}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Bien sélectionné</p>
                                <p className="font-bold text-lg">{bien.marque || bien.fabricant} {bien.modele || ''}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">{bien.type_bien}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => { setBien(null); setFormData(prev => ({ ...prev, id_bien: '' })); }} 
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Changer
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AppIcon icon={ClipboardDocumentListIcon} size="md" className="text-primary-600" />
                        2. Type de mouvement <span className="text-red-500">*</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allowedTypes.map((type) => {
                            const isSelected = formData.type_mouvement === type.value;
                            return (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleChange('type_mouvement', type.value)}
                                    className={`
                                        relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                                        ${isSelected 
                                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md ring-2 ring-primary-200' 
                                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm'
                                        }
                                    `}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                                            <AppIcon icon={CheckCircleIcon} size="xs" className="text-white" />
                                        </div>
                                    )}
                                    <div className={`mb-2 ${isSelected ? 'scale-110' : 'group-hover:scale-110'} transition-transform origin-left`}>
                                        <AppIcon icon={type.Icon} size="lg" className={isSelected ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'} />
                                    </div>
                                    <div className={`font-bold ${isSelected ? 'text-primary-700' : 'text-gray-700 dark:text-slate-300'}`}>
                                        {type.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        {type.description}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    
                    {allowedTypes.length === 0 && (
                        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm flex items-center gap-2">
                            <AppIcon icon={ExclamationTriangleIcon} size="sm" />
                            Vous n'avez pas les permissions nécessaires pour créer ce type de mouvement.
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <AppIcon icon={DocumentTextIcon} size="md" className="text-primary-600" />
                        3. Détails opérationnels
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date du mouvement</label>
                            <input
                                type="datetime-local"
                                value={formData.date_mouvement}
                                onChange={(e) => handleChange('date_mouvement', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
                            />
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Peut être planifiée dans le futur</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Raison du mouvement *</label>
                            <input
                                type="text"
                                value={formData.raison}
                                onChange={(e) => handleChange('raison', e.target.value)}
                                placeholder="Ex: Transfert vers nouveau site..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Localisation source</label>
                            <input
                                type="text"
                                value={formData.localisation_source}
                                onChange={(e) => handleChange('localisation_source', e.target.value)}
                                placeholder="Ex: Entrepôt A"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Localisation destination</label>
                            <input
                                type="text"
                                value={formData.localisation_destination}
                                onChange={(e) => handleChange('localisation_destination', e.target.value)}
                                placeholder="Ex: Site Rutshuru"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                            />
                        </div>
                    </div>

                    {showJustificatifs && (
                        <div className="mt-6 p-5 bg-orange-50 rounded-lg border border-orange-200 animate-fade-in">
                            <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                                <AppIcon icon={ExclamationTriangleIcon} size="sm" />
                                Pièces requises pour Sortie/Cession
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Responsable de la sortie *</label>
                                    <input
                                        type="text"
                                        value={formData.responsable_sortie}
                                        onChange={(e) => handleChange('responsable_sortie', e.target.value)}
                                        className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Référence Document</label>
                                    <input
                                        type="text"
                                        value={formData.piece_justificative}
                                        onChange={(e) => handleChange('piece_justificative', e.target.value)}
                                        placeholder="Ex: Bon de sortie n°..."
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg font-medium transition"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-primary-200 transition transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                    >
                        {!loading && <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />}
                        {loading ? 'Création en cours...' : 'Enregistrer le mouvement'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                        <AppIcon icon={ExclamationTriangleIcon} size="sm" />
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
};

export default NouveauMouvement;
