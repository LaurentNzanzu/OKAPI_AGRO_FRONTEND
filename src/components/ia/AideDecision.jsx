// frontend/src/components/ia/AideDecision.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { iaService } from '../../services/ia';
import { biensService } from '../../services/biens';
import HealthScoreCard from './HealthScoreCard';
import DecisionStrategiqueCard from './DecisionStrategiqueCard'; // ✅ NOUVEAU
import PageHeader from '../ui/PageHeader';
import {
  AppIcon,
  ArrowLeftIcon,
  CpuChipIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
} from '../ui/icons';

const AideDecision = () => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bienIdFromUrl = searchParams.get('bien_id');

    const [bienId, setBienId] = useState(bienIdFromUrl || '');
    const [bien, setBien] = useState(null);
    const [healthScore, setHealthScore] = useState(null);
    const [decisionStrategique, setDecisionStrategique] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingDecision, setLoadingDecision] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const searchBiens = async (term) => {
        if (!term || term.length < 2) return;
        try {
            const response = await biensService.getAll({ search: term, limit: 10 });
            setSearchResults(response.biens || []);
        } catch (err) {
            console.error('Erreur recherche:', err);
        }
    };

    const loadBienAndScore = async (id) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setHealthScore(null);
        setDecisionStrategique(null);

        try {
            // Charger les infos du bien
            const bienData = await biensService.getById(id);
            setBien(bienData);

            // Charger le Health Score
            const scoreData = await iaService.getHealthScore(id);
            setHealthScore(scoreData);

            // Charger la décision stratégique
            setLoadingDecision(true);
            try {
                const decisionData = await iaService.getDecisionStrategique(id);
                setDecisionStrategique(decisionData);
            } catch (err) {
                console.warn('Décision stratégique non disponible:', err);
                if (err.response?.status === 404) {
                    setError('Aucune analyse stratégique disponible pour ce bien');
                }
            } finally {
                setLoadingDecision(false);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
            if (err.response?.status === 404) {
                setError(`Bien avec l'ID ${id} non trouvé`);
            } else {
                setError(err.response?.data?.detail || 'Erreur lors du calcul du score');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (bienId && !isNaN(bienId)) {
            loadBienAndScore(parseInt(bienId));
        } else {
            setError('Veuillez saisir un ID de bien valide');
        }
    };

    return (
        <div className="app-page max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300">
                    <AppIcon icon={ArrowLeftIcon} size="md" />
                </button>
                <PageHeader title="Aide à la décision IA" icon={CpuChipIcon} />
            </div>

            {/* Formulaire de sélection du bien */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">1. Sélectionner un bien</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                            Bien à analyser
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                placeholder="ID du bien..."
                                value={bienId}
                                onChange={(e) => setBienId(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                            >
                                {loading ? 'Analyse...' : 'Analyser'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                            Ou rechercher par désignation:
                        </p>
                        <input
                            type="text"
                            placeholder="Rechercher un bien..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                searchBiens(e.target.value);
                            }}
                            className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-600"
                        />
                        {searchResults.length > 0 && (
                            <div className="mt-2 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                {searchResults.map(b => (
                                    <button
                                        key={b.id_bien}
                                        type="button"
                                        onClick={() => {
                                            setBienId(b.id_bien.toString());
                                            setSearchTerm('');
                                            setSearchResults([]);
                                            loadBienAndScore(b.id_bien);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50 border-b last:border-b-0"
                                    >
                                        <div className="font-medium">{b.marque || b.fabricant} {b.modele || ''}</div>
                                        <div className="text-xs text-gray-400 dark:text-slate-500">ID: {b.id_bien} • {b.type_bien}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Affichage des résultats */}
            {bien && healthScore && (
                <div className="app-page">
                    {/* En-tête du bien */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">
                                    {bien.marque || bien.fabricant} {bien.modele || ''}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Type: {bien.type_bien} • État: {bien.etat}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(`/biens/${bien.id_bien}`)}
                                className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                                Voir la fiche complète →
                            </button>
                        </div>
                    </div>

                    {/* Health Score Card */}
                    <HealthScoreCard
                        healthScore={healthScore}
                        onRefresh={() => loadBienAndScore(bien.id_bien)}
                    />

                    {/* ✅ Décision stratégique (Phase 1.2) */}
                    {loadingDecision ? (
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500 dark:text-slate-400">Analyse stratégique en cours...</p>
                        </div>
                    ) : decisionStrategique ? (
                        <DecisionStrategiqueCard
                            decision={decisionStrategique}
                            onRefresh={() => loadBienAndScore(bien.id_bien)}
                        />
                    ) : null}
                </div>
            )}

            {/* Message d'accueil si aucun bien sélectionné */}
            {!bien && !loading && !error && (
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-12 text-center">
                    <div className="mb-4 flex justify-center">
                        <AppIcon icon={CpuChipIcon} size="lg" className="w-12 h-12 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Assistant IA OKAPI VISION</h2>
                    <p className="text-gray-500 dark:text-slate-400">
                        Sélectionnez un bien ci-dessus pour obtenir une analyse complète :
                    </p>
                    <ul className="mt-4 text-sm text-gray-400 dark:text-slate-500 space-y-2">
                        <li className="flex items-center justify-center gap-2">
                            <AppIcon icon={ChartBarIcon} size="sm" />
                            Score de santé (0-100)
                        </li>
                        <li className="flex items-center justify-center gap-2">
                            <AppIcon icon={CurrencyDollarIcon} size="sm" />
                            Analyse coût de conservation vs remplacement
                        </li>
                        <li className="flex items-center justify-center gap-2">
                            <AppIcon icon={WrenchScrewdriverIcon} size="sm" />
                            Recommandations personnalisées
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AideDecision;