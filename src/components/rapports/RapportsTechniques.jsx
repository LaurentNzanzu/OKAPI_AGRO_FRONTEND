// frontend/src/components/rapports/RapportsTechniques.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getRapportTechnique } from '../../services/rapports';
import ExportRapport from './ExportRapport';
import { WrenchScrewdriverIcon, ExclamationTriangleIcon, Cog6ToothIcon, CubeIcon } from '@heroicons/react/24/outline';
import { AppIcon, ChartBarIcon, MagnifyingGlassIcon, TrophyIcon } from '../ui/icons';

const RapportsTechniques = () => {
  const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [dateDebut, setDateDebut] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getRapportTechnique(dateDebut, dateFin);
            setData(result);
        } catch (err) {
            console.error('Erreur chargement rapport technique:', err);
            setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateDebut, dateFin]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600 dark:text-slate-300">Chargement du rapport...</span>
            </div>
        );
    }

    return (
        <AppPage>
            <PageHeader
                title="Rapport Technique"
                subtitle="Analyse des pannes, maintenances et état du parc"
                icon={WrenchScrewdriverIcon}
            />

            <Card compact>
                <div className="app-filter-bar">
                    <div className="app-filter-field">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date début</label>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                            className="form-input w-full"
                        />
                    </div>
                    <div className="app-filter-field">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date fin</label>
                        <input
                            type="date"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                            className="form-input w-full"
                        />
                    </div>
                    <Button onClick={fetchData} className="md:self-end">Actualiser</Button>
                </div>
            </Card>

            {/* Export */}
            <ExportRapport
                typeRapport="technique"
                dateDebut={dateDebut}
                dateFin={dateFin}
            />

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            ) : data ? (
                <>
                    <div className="app-stats-grid">
                        <StatCard label="Total biens" value={data.synthese.total_biens} icon={CubeIcon} hint={`Taux occupation: ${data.synthese.taux_occupation}%`} />
                        <StatCard label="Pannes" value={data.synthese.total_pannes} icon={ExclamationTriangleIcon} accent="warning" hint="sur la période" />
                        <StatCard label="Maintenances" value={data.synthese.total_maintenances} icon={Cog6ToothIcon} hint={`Taux résolution: ${data.synthese.taux_resolution_maintenances}%`} />
                        <StatCard label="Biens actifs" value={data.synthese.biens_actifs} icon={CubeIcon} hint={`Réformés: ${data.synthese.biens_reformes}`} />
                    </div>

                    {/* Répartition par état */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
                            <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
                                <AppIcon icon={ChartBarIcon} size="sm" />
                                Répartition par état
                            </h2>
                            <div className="space-y-2">
                                {Object.entries(data.repartition_etats).map(([etat, count]) => (
                                    <div key={etat} className="flex items-center justify-between">
                                        <span className="text-sm">{etat}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-primary-600 h-2 rounded-full" 
                                                    style={{ width: `${(count / data.synthese.total_biens) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
                            <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
                                <AppIcon icon={MagnifyingGlassIcon} size="sm" />
                                Pannes par type
                            </h2>
                            <div className="space-y-2">
                                {Object.entries(data.pannes_par_type).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm">{type}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-red-600 h-2 rounded-full" 
                                                    style={{ width: `${(count / data.synthese.total_pannes) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top biens en panne */}
                    {data.top_biens_pannes.length > 0 && (
                        <Card title="Top 5 biens les plus en panne" icon={<AppIcon icon={TrophyIcon} size="md" />} noPadding>
                            <div className="app-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Bien ID</th>
                                        <th>QR Code</th>
                                        <th className="text-center">Nombre de pannes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.top_biens_pannes.map((bien) => (
                                        <tr key={bien.bien_id}>
                                            <td className="px-4 py-3 text-sm">{bien.bien_id}</td>
                                            <td className="px-4 py-3 text-sm font-mono">{bien.qr_code}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
                                                    {bien.nb_pannes}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </Card>
                    )}

                    {/* Maintenances */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-4">
                        <h2 className="font-semibold mb-3 inline-flex items-center gap-2">
                            <AppIcon icon={WrenchScrewdriverIcon} size="sm" />
                            Maintenances
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-700">{data.maintenances.preventives}</p>
                                <p className="text-sm text-gray-600 dark:text-slate-300">Préventives</p>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <p className="text-2xl font-bold text-orange-700">{data.maintenances.correctives}</p>
                                <p className="text-sm text-gray-600 dark:text-slate-300">Correctives</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </AppPage>
    );
};

export default RapportsTechniques;