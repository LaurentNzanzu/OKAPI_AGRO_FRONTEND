// frontend/src/components/caisse/GestionCaisse.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { caisseService } from '../../services/caisse';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ScaleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';
import Button from '../ui/Button';
import Card from '../ui/Card';

export const GestionCaisse = ({ onApprovisionner, onRapprochement, onViewPDF }) => {
    const { t } = useTranslation();
    const [solde, setSolde] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [verificationMontant, setVerificationMontant] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [mouvements, setMouvements] = useState([]);

    const fetchCaisseData = async () => {
        try {
            setLoading(true);
            const soldeData = await caisseService.getSolde();
            setSolde(soldeData);
            
            const mvtData = await caisseService.getMouvements({ page: 1, limit: 10 });
            setMouvements(mvtData.items || []);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement caisse:', err);
            setError(t('caisse.loadError') || 'Impossible de charger les données de la caisse');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaisseData();
    }, []);

    const handleVerifierTresorerie = async (e) => {
        e.preventDefault();
        if (!verificationMontant || parseFloat(verificationMontant) <= 0) return;
        
        try {
            const res = await caisseService.verifierTresorerie(parseFloat(verificationMontant));
            setVerificationResult(res);
        } catch (err) {
            console.error('Erreur vérification:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const physical = solde?.solde_physique || 0;
    const theoretical = solde?.solde_theorique || 0;
    const ecart = physical - theoretical;

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* Synthese Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg border-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">{t('caisse.soldePhysique')}</p>
                            <h3 className="text-2xl font-bold mt-1">{formatPrice(physical)}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <CurrencyDollarIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg border-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">{t('caisse.soldeTheorique')}</p>
                            <h3 className="text-2xl font-bold mt-1">{formatPrice(theoretical)}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <ClockIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className={`${ecart === 0 ? 'bg-gradient-to-br from-slate-700 to-slate-800' : ecart > 0 ? 'bg-gradient-to-br from-teal-500 to-emerald-500' : 'bg-gradient-to-br from-rose-500 to-red-600'} text-white shadow-lg border-0`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-100 text-sm font-medium">{t('caisse.ecart')}</p>
                            <h3 className="text-2xl font-bold mt-1">{formatPrice(ecart)}</h3>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <ScaleIcon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                    <div className="space-y-3">
                        <p className="text-gray-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Actions rapides</p>
                        <div className="flex flex-col gap-2">
                            <Button
                                size="sm"
                                variant="success"
                                className="w-full flex justify-center items-center gap-1.5"
                                onClick={onApprovisionner}
                            >
                                <PlusIcon className="h-4 w-4" />
                                {t('caisse.approvisionner')}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full flex justify-center items-center gap-1.5"
                                onClick={onRapprochement}
                            >
                                <ScaleIcon className="h-4 w-4" />
                                Rapprochement
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Verification Caisse */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-primary-500" />
                            {t('caisse.verifierTresorerie')}
                        </h4>
                        <form onSubmit={handleVerifierTresorerie} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-2">
                                    {t('caisse.montantAVerifier')} (USD)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={verificationMontant}
                                        onChange={(e) => setVerificationMontant(e.target.value)}
                                        className="form-input flex-1 dark:bg-slate-800 dark:border-slate-700"
                                        placeholder="0.00"
                                        required
                                    />
                                    <Button type="submit" variant="primary">
                                        {t('caisse.verifier')}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Result Panel */}
                        {verificationResult && (
                            <div className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${verificationResult.est_suffisante ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'}`}>
                                <div className="mt-0.5">
                                    <AppIcon icon={verificationResult.est_suffisante ? CheckCircleIcon : ExclamationTriangleIcon} size="md" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">
                                        {verificationResult.est_suffisante ? t('caisse.tresorerieSuffisante') : t('caisse.tresorerieInsuffisante')}
                                    </p>
                                    <p className="text-xs mt-1">{verificationResult.message}</p>
                                    <p className="text-xs mt-2 font-mono">
                                        {t('caisse.soldeDisponible')} : {formatPrice(verificationResult.solde_disponible)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Historique des 10 derniers Mouvements */}
                <div className="lg:col-span-2">
                    <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                            <ClockIcon className="h-5 w-5 text-indigo-500" />
                            {t('caisse.historique')}
                        </h4>
                        <div className="app-table-wrap">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-slate-800 text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-3 py-2">{t('caisse.date')}</th>
                                        <th className="px-3 py-2">{t('caisse.reference')}</th>
                                        <th className="px-3 py-2">{t('caisse.type')}</th>
                                        <th className="px-3 py-2 text-right">{t('caisse.montant')}</th>
                                        <th className="px-3 py-2">Motif</th>
                                        <th className="px-3 py-2 text-center">Statut</th>
                                        <th className="px-3 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {mouvements.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-gray-500">
                                                {t('caisse.aucunMouvement')}
                                            </td>
                                        </tr>
                                    ) : (
                                        mouvements.map((m) => (
                                            <tr key={m.id_mouvement} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(m.date_mouvement)}</td>
                                                <td className="px-3 py-2 font-semibold font-mono">{m.numero_piece}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${m.type_mouvement === 'ENTREE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                                                        {m.type_mouvement}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold font-mono">
                                                    {m.type_mouvement === 'ENTREE' ? '+' : '-'}{formatPrice(m.montant)}
                                                </td>
                                                <td className="px-3 py-2 max-w-[150px] truncate" title={m.motif}>{m.motif}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${m.statut === 'VALIDE' || m.statut === 'VALIDEE' ? 'bg-green-100 text-green-800' : m.statut === 'EN_ATTENTE_FONDS' ? 'bg-amber-100 text-amber-800' : m.statut === 'REJETEE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {m.statut}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        onClick={() => onViewPDF(m.id_mouvement)}
                                                        className="text-primary-600 hover:text-primary-800 p-1"
                                                    >
                                                        <DocumentTextIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GestionCaisse;