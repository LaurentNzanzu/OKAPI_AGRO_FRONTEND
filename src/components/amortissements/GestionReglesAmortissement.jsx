// frontend/src/components/amortissements/GestionReglesAmortissement.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { amortissementsService } from '../../services/amortissements';
import { planComptableService } from '../../services/planComptable'; // Ajout de l'import
import { useAuth } from '../../hooks/useAuth';
import {
  AppIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalculatorIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from '../ui/icons';

// Fonction utilitaire pour formater les erreurs FastAPI
const formatApiError = (err, t) => {
    if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
            return err.response.data.detail
                .map(d => {
                    const field = d.loc?.filter(l => l !== 'body').join('.') || t('common.errors.field');
                    return `${field}: ${d.msg}`;
                })
                .join(', ');
        }
        if (typeof err.response.data.detail === 'string') {
            return err.response.data.detail;
        }
    }
    return err.message || t('common.errors.generic');
};

const GestionReglesAmortissement = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const canManageRegles = hasPermission('amortissements.update');
    const [regles, setRegles] = useState([]);
    const [comptesDisponibles, setComptesDisponibles] = useState([]); // Ajout de l'état
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingRegle, setEditingRegle] = useState(null);
    const [formData, setFormData] = useState({
        categorie_bien: '',
        duree_vie_ans: 5,
        taux_fiscal: 20.0,
        coeff_deg_3_4_ans: 1.5,
        coeff_deg_5_6_ans: 2.0,
        coeff_deg_7_plus_ans: 2.5,
        compte_dotation: '6812',
        compte_amortissement: '',
        compte_depreciation: '2944',
        base_jours_annee: 360,
        prorata_debut_mois: true,
        est_active: true
    });

    const categoriesDisponibles = [
        'vehicule',
        'machine',
        'ordinateur',
        'mobilier',
        'autre'
    ];

    useEffect(() => {
        fetchRegles();
    }, []);

    // Ajout du useEffect pour charger les comptes
    useEffect(() => {
        const loadComptes = async () => {
            try {
                const comptes = await planComptableService.getActive();
                setComptesDisponibles(comptes);
            } catch (err) {
                console.error('Erreur chargement comptes:', err);
            }
        };
        loadComptes();
    }, []);

    const fetchRegles = async () => {
        try {
            setLoading(true);
            const data = await amortissementsService.getRegles();
            setRegles(data);
        } catch (err) {
            console.error('Erreur chargement règles:', err);
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialiserDefaults = async () => {
        if (!window.confirm(t('amortissements.regles.initConfirm'))) {
            return;
        }

        try {
            setLoading(true);
            const nouvellesRegles = await amortissementsService.initialiserReglesDefault();
            setSuccess(t('amortissements.regles.initSuccess', { count: nouvellesRegles.length }));
            await fetchRegles();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur initialisation:', err);
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (regle = null) => {
        if (regle) {
            setEditingRegle(regle);
            setFormData({
                categorie_bien: regle.categorie_bien,
                duree_vie_ans: regle.duree_vie_ans,
                taux_fiscal: regle.taux_fiscal,
                coeff_deg_3_4_ans: regle.coeff_deg_3_4_ans,
                coeff_deg_5_6_ans: regle.coeff_deg_5_6_ans,
                coeff_deg_7_plus_ans: regle.coeff_deg_7_plus_ans,
                compte_dotation: regle.compte_dotation,
                compte_amortissement: regle.compte_amortissement || '',
                compte_depreciation: regle.compte_depreciation,
                base_jours_annee: regle.base_jours_annee,
                prorata_debut_mois: regle.prorata_debut_mois,
                est_active: regle.est_active
            });
        } else {
            setEditingRegle(null);
            setFormData({
                categorie_bien: '',
                duree_vie_ans: 5,
                taux_fiscal: 20.0,
                coeff_deg_3_4_ans: 1.5,
                coeff_deg_5_6_ans: 2.0,
                coeff_deg_7_plus_ans: 2.5,
                compte_dotation: '6812',
                compte_amortissement: '',
                compte_depreciation: '2944',
                base_jours_annee: 360,
                prorata_debut_mois: true,
                est_active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!editingRegle && !formData.categorie_bien) {
            setError(t('amortissements.regles.selectCategory'));
            setTimeout(() => setError(null), 3000);
            return;
        }

        try {
            if (editingRegle) {
                await amortissementsService.updateRegle(editingRegle.id_regle, formData);
                setSuccess(t('amortissements.regles.updateSuccess'));
            } else {
                await amortissementsService.createRegle(formData);
                setSuccess(t('amortissements.regles.createSuccess'));
            }
            setShowModal(false);
            await fetchRegles();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDelete = async (idRegle, categorie) => {
        if (!window.confirm(t('amortissements.regles.deleteConfirm', { categorie }))) {
            return;
        }

        try {
            await amortissementsService.deleteRegle(idRegle);
            setSuccess(t('amortissements.regles.deleteSuccess'));
            await fetchRegles();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur suppression:', err);
            const errorMessage = formatApiError(err, t);
            setError(errorMessage);
            setTimeout(() => setError(null), 5000);
        }
    };

    const getCoefficientLabel = (duree) => {
        if (duree <= 4) return t('amortissements.regles.coeff34');
        if (duree <= 6) return t('amortissements.regles.coeff56');
        return t('amortissements.regles.coeff7');
    };

    if (loading && regles.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-gray-500 dark:text-slate-400">{t('amortissements.regles.loading')}</p>
            </div>
        );
    }

    return (
        <div className="app-page">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">
                    <p className="text-sm font-medium">{t('amortissements.regles.errorTitle')}</p>
                    <p className="text-xs">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg border border-green-200">
                    {success}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50 dark:bg-slate-800/50 flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <AppIcon icon={Cog6ToothIcon} size="md" />
                            {t('amortissements.regles.title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            {t('amortissements.regles.subtitle')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {canManageRegles && (
                            <>
                                <button
                                    onClick={handleInitialiserDefaults}
                                    className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-600 text-sm inline-flex items-center gap-1"
                                >
                                    <AppIcon icon={ClipboardDocumentListIcon} size="xs" className="text-white" />
                                    {t('amortissements.regles.initDefaults')}
                                </button>
                                <button
                                    onClick={() => handleOpenModal()}
                                    className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                                >
                                    {t('amortissements.regles.newRule')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.regles.colCategorie')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.regles.colDuree')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.regles.colTauxFiscal')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.regles.colCoefficient')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400">{t('amortissements.regles.colComptes')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('common.status')}</th>
                                {canManageRegles && (
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400">{t('common.actions')}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {regles.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageRegles ? 7 : 6} className="text-center py-8 text-gray-400 dark:text-slate-500">
                                        {t('amortissements.regles.empty')}
                                    </td>
                                </tr>
                            ) : (
                                regles.map((regle) => (
                                    <tr key={regle.id_regle} className="hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800/50">
                                        <td className="px-4 py-3 text-sm font-medium">
                                            <span className="capitalize">{regle.categorie_bien}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center">{regle.duree_vie_ans}</td>
                                        <td className="px-4 py-3 text-sm text-center">{regle.taux_fiscal}%</td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            {getCoefficientLabel(regle.duree_vie_ans)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono">
                                            D: {regle.compte_dotation} / A: {regle.compte_amortissement || t('amortissements.regles.compteAuto')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {regle.est_active ? (
                                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                    <AppIcon icon={CheckCircleIcon} size="xs" /> {t('amortissements.regles.active')}
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                    <AppIcon icon={XCircleIcon} size="xs" /> {t('amortissements.regles.inactive')}
                                                </span>
                                            )}
                                        </td>
                                        {canManageRegles && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleOpenModal(regle)}
                                                        className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-600"
                                                    >
                                                        {t('common.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(regle.id_regle, regle.categorie_bien)}
                                                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                                    >
                                                        {t('common.delete')}
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg mt-6">
                <p className="text-sm font-bold text-primary-600 mb-2 flex items-center gap-2">
                    <AppIcon icon={CalculatorIcon} size="sm" />
                    {t('amortissements.regles.rulesTitle')}
                </p>
                <ul className="text-xs text-primary-600 space-y-1 list-disc list-inside ml-4">
                    <li>{t('amortissements.regles.rule1')}</li>
                    <li>{t('amortissements.regles.rule2')}</li>
                    <li>{t('amortissements.regles.rule3')}</li>
                    <li>{t('amortissements.regles.rule4')}</li>
                    <li>{t('amortissements.regles.rule5')}</li>
                </ul>
            </div>

            {showModal && canManageRegles && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">
                                    <span className="inline-flex items-center gap-2">
                                        <AppIcon icon={editingRegle ? PencilSquareIcon : PlusIcon} size="sm" />
                                        {editingRegle ? t('amortissements.regles.editRule') : t('amortissements.regles.newRuleTitle')}
                                    </span>
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-300">
                                    <AppIcon icon={XMarkIcon} size="md" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissements.regles.categorieBien')}</label>
                                        <select
                                            value={formData.categorie_bien}
                                            onChange={(e) => setFormData({ ...formData, categorie_bien: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                            required
                                            disabled={editingRegle !== null}
                                        >
                                            <option value="">{t('amortissements.regles.selectCategorie')}</option>
                                            {categoriesDisponibles.map(cat => (
                                                <option key={cat} value={cat} className="capitalize">{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissements.regles.dureeVie')}</label>
                                        <input
                                            type="number"
                                            step="1"
                                            value={formData.duree_vie_ans}
                                            onChange={(e) => setFormData({ ...formData, duree_vie_ans: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissements.regles.tauxFiscal')}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.taux_fiscal}
                                            onChange={(e) => setFormData({ ...formData, taux_fiscal: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('amortissements.regles.tauxFiscalHint')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amortissements.regles.baseJours')}</label>
                                        <select
                                            value={formData.base_jours_annee}
                                            onChange={(e) => setFormData({ ...formData, base_jours_annee: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                        >
                                            <option value="360">{t('amortissements.regles.base360')}</option>
                                            <option value="365">{t('amortissements.regles.base365')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('amortissements.regles.coeffDegressifs')}</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-slate-400">{t('amortissements.regles.duree34')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.coeff_deg_3_4_ans}
                                                onChange={(e) => setFormData({ ...formData, coeff_deg_3_4_ans: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-slate-400">{t('amortissements.regles.duree56')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.coeff_deg_5_6_ans}
                                                onChange={(e) => setFormData({ ...formData, coeff_deg_5_6_ans: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-slate-400">{t('amortissements.regles.duree7plus')}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.coeff_deg_7_plus_ans}
                                                onChange={(e) => setFormData({ ...formData, coeff_deg_7_plus_ans: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('amortissements.regles.comptesTitle')}</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Remplacement par le select dynamique ici */}
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-slate-400">{t('amortissements.regles.compteDotation')}</label>
                                            <select
                                                value={formData.compte_dotation}
                                                onChange={(e) => setFormData({ ...formData, compte_dotation: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg font-mono"
                                            >
                                                <option value="">Sélectionner un compte</option>
                                                {comptesDisponibles
                                                    .filter(c => c.classe === '6' || c.classe === '2')
                                                    .map(c => (
                                                        <option key={c.id} value={c.numero}>{c.numero} - {c.libelle}</option>
                                                    ))}
                                            </select>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Ex: 6812</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-slate-400">{t('amortissements.regles.compteAmortissement')}</label>
                                            <input
                                                type="text"
                                                value={formData.compte_amortissement}
                                                onChange={(e) => setFormData({ ...formData, compte_amortissement: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg font-mono"
                                                placeholder={t('amortissements.regles.compteAmortPlaceholder')}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 dark:text-slate-400">{t('amortissements.regles.compteDepreciation')}</label>
                                            <input
                                                type="text"
                                                value={formData.compte_depreciation}
                                                onChange={(e) => setFormData({ ...formData, compte_depreciation: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg font-mono"
                                            />
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Ex: 2944 (OHADA)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.prorata_debut_mois}
                                            onChange={(e) => setFormData({ ...formData, prorata_debut_mois: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-slate-300">{t('amortissements.regles.prorataDebutMois')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.est_active}
                                            onChange={(e) => setFormData({ ...formData, est_active: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-slate-300">{t('amortissements.regles.regleActive')}</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        {editingRegle ? t('amortissements.regles.update') : t('amortissements.regles.create')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-400"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionReglesAmortissement;