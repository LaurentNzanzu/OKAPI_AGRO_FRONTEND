// frontend/src/components/administration/PlanComptable.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { planComptableService } from '../../services/planComptable';
import {
    AppIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon
} from '../ui/icons';
import Button from '../ui/Button';
import Card from '../ui/Card';

// ============================================================
// MODAL DE CRÉATION/ÉDITION D'UN COMPTE
// ============================================================
const CompteModal = ({ isOpen, onClose, onSave, compte, isEdit = false }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        numero: '',
        libelle: '',
        classe: '',
        type: '',
        est_actif: true
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const classes = [
        { value: '2', label: 'Classe 2 - Immobilisations' },
        { value: '4', label: 'Classe 4 - Tiers' },
        { value: '5', label: 'Classe 5 - Trésorerie' },
        { value: '6', label: 'Classe 6 - Charges' },
        { value: '7', label: 'Classe 7 - Produits' },
        { value: '8', label: 'Classe 8 - Comptes spécifiques' }
    ];

    const types = [
        { value: 'actif', label: 'Actif' },
        { value: 'passif', label: 'Passif' },
        { value: 'charge', label: 'Charge' },
        { value: 'produit', label: 'Produit' }
    ];

    useEffect(() => {
        if (compte && isEdit) {
            setFormData({
                numero: compte.numero || '',
                libelle: compte.libelle || '',
                classe: compte.classe || '',
                type: compte.type || '',
                est_actif: compte.est_actif !== undefined ? compte.est_actif : true
            });
        } else {
            setFormData({
                numero: '',
                libelle: '',
                classe: '',
                type: '',
                est_actif: true
            });
        }
        setErrors({});
    }, [compte, isEdit, isOpen]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.numero.trim()) newErrors.numero = 'Le numéro du compte est requis';
        if (!formData.libelle.trim()) newErrors.libelle = 'Le libellé du compte est requis';
        if (!formData.classe) newErrors.classe = 'La classe est requise';
        if (!formData.type) newErrors.type = 'Le type est requis';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        {isEdit ? (
                            <span className="inline-flex items-center gap-2">
                                <PencilSquareIcon className="w-5 h-5" />
                                {t('planComptable.editTitle')}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2">
                                <PlusIcon className="w-5 h-5" />
                                {t('planComptable.createTitle')}
                            </span>
                        )}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-300">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="form-label">{t('planComptable.numero')} *</label>
                        <input
                            type="text"
                            value={formData.numero}
                            onChange={(e) => handleChange('numero', e.target.value)}
                            className={`form-input ${errors.numero ? 'border-red-500' : ''}`}
                            placeholder="Ex: 6812"
                            disabled={isEdit}
                        />
                        {errors.numero && <span className="text-red-500 text-xs">{errors.numero}</span>}
                    </div>

                    <div>
                        <label className="form-label">{t('planComptable.libelle')} *</label>
                        <input
                            type="text"
                            value={formData.libelle}
                            onChange={(e) => handleChange('libelle', e.target.value)}
                            className={`form-input ${errors.libelle ? 'border-red-500' : ''}`}
                            placeholder="Ex: Dotations aux amortissements des immobilisations corporelles"
                        />
                        {errors.libelle && <span className="text-red-500 text-xs">{errors.libelle}</span>}
                    </div>

                    <div>
                        <label className="form-label">{t('planComptable.classe')} *</label>
                        <select
                            value={formData.classe}
                            onChange={(e) => handleChange('classe', e.target.value)}
                            className={`form-input ${errors.classe ? 'border-red-500' : ''}`}
                        >
                            <option value="">{t('planComptable.selectClasse')}</option>
                            {classes.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                        {errors.classe && <span className="text-red-500 text-xs">{errors.classe}</span>}
                    </div>

                    <div>
                        <label className="form-label">{t('planComptable.type')} *</label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className={`form-input ${errors.type ? 'border-red-500' : ''}`}
                        >
                            <option value="">{t('planComptable.selectType')}</option>
                            {types.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {errors.type && <span className="text-red-500 text-xs">{errors.type}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="est_actif"
                            checked={formData.est_actif}
                            onChange={(e) => handleChange('est_actif', e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="est_actif" className="text-sm text-gray-700 dark:text-slate-300">
                            {t('planComptable.actif')}
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {submitting ? t('common.saving') : (isEdit ? t('common.update') : t('common.add'))}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================
// COMPOSANT PRINCIPAL - PLAN COMPTABLE
// ============================================================
const PlanComptable = () => {
    const { t } = useTranslation();
    const [comptes, setComptes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [search, setSearch] = useState('');
    const [filtreClasse, setFiltreClasse] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompte, setEditingCompte] = useState(null);

    const classes = [
        { value: '', label: 'Toutes les classes' },
        { value: '2', label: 'Classe 2' },
        { value: '4', label: 'Classe 4' },
        { value: '5', label: 'Classe 5' },
        { value: '6', label: 'Classe 6' },
        { value: '7', label: 'Classe 7' },
        { value: '8', label: 'Classe 8' }
    ];

    const fetchComptes = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (filtreClasse) params.classe = filtreClasse;
            const data = await planComptableService.getAll(params);
            setComptes(data || []);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement plan comptable:', err);
            setError(err.response?.data?.detail || t('planComptable.loadError'));
        } finally {
            setLoading(false);
        }
    }, [search, filtreClasse, t]);

    useEffect(() => {
        fetchComptes();
    }, [fetchComptes]);

    const handleSave = async (data) => {
        try {
            if (editingCompte) {
                await planComptableService.update(editingCompte.id, data);
                setSuccess(t('planComptable.updateSuccess'));
            } else {
                await planComptableService.create(data);
                setSuccess(t('planComptable.createSuccess'));
            }
            setShowModal(false);
            setEditingCompte(null);
            fetchComptes();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            setError(err.response?.data?.detail || t('planComptable.saveError'));
            setTimeout(() => setError(null), 3000);
            throw err;
        }
    };

    const handleDelete = async (id, numero) => {
        if (!window.confirm(t('planComptable.deleteConfirm', { numero }))) return;
        
        try {
            await planComptableService.delete(id);
            setSuccess(t('planComptable.deleteSuccess'));
            fetchComptes();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Erreur suppression:', err);
            setError(err.response?.data?.detail || t('planComptable.deleteError'));
            setTimeout(() => setError(null), 3000);
        }
    };

    const getClasseLabel = (classe) => {
        const labels = {
            '2': 'Classe 2',
            '4': 'Classe 4',
            '5': 'Classe 5',
            '6': 'Classe 6',
            '7': 'Classe 7',
            '8': 'Classe 8'
        };
        return labels[classe] || classe;
    };

    const getTypeBadge = (type) => {
        const colors = {
            actif: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            passif: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            charge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            produit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    if (loading && comptes.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="app-page">
            {/* Messages */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    {success}
                </div>
            )}

            <Card
                title={t('planComptable.title')}
                subtitle={t('planComptable.subtitle')}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => {
                            setEditingCompte(null);
                            setShowModal(true);
                        }}
                    >
                        <AppIcon icon={PlusIcon} size="sm" className="text-white" />
                        {t('planComptable.addCompte')}
                    </Button>
                }
            >
                {/* Filtres */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <AppIcon icon={MagnifyingGlassIcon} size="sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="form-input pl-10"
                                placeholder={t('planComptable.searchPlaceholder')}
                            />
                        </div>
                    </div>
                    <div className="w-[200px]">
                        <select
                            value={filtreClasse}
                            onChange={(e) => setFiltreClasse(e.target.value)}
                            className="form-input"
                        >
                            {classes.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearch('');
                            setFiltreClasse('');
                        }}
                    >
                        {t('common.clear')}
                    </Button>
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('planComptable.colNumero')}</th>
                                <th>{t('planComptable.colLibelle')}</th>
                                <th>{t('planComptable.colClasse')}</th>
                                <th>{t('planComptable.colType')}</th>
                                <th className="text-center">{t('planComptable.colStatus')}</th>
                                <th className="text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comptes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-400 dark:text-slate-500">
                                        {search || filtreClasse ? t('planComptable.noResults') : t('planComptable.empty')}
                                    </td>
                                </tr>
                            ) : (
                                comptes.map((compte) => (
                                    <tr key={compte.id}>
                                        <td className="font-mono font-medium">{compte.numero}</td>
                                        <td>{compte.libelle}</td>
                                        <td>{getClasseLabel(compte.classe)}</td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(compte.type)}`}>
                                                {compte.type}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {compte.est_actif ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <AppIcon icon={CheckCircleIcon} size="xs" />
                                                    {t('planComptable.active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                                    <AppIcon icon={XCircleIcon} size="xs" />
                                                    {t('planComptable.inactive')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => {
                                                        setEditingCompte(compte);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                                                    title={t('common.edit')}
                                                >
                                                    <AppIcon icon={PencilSquareIcon} size="xs" className="text-white" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(compte.id, compte.numero)}
                                                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                                    title={t('common.delete')}
                                                >
                                                    <AppIcon icon={TrashIcon} size="xs" className="text-white" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                {comptes.length > 0 && (
                    <div className="mt-4 text-sm text-gray-500 dark:text-slate-400">
                        {t('planComptable.totalComptes', { count: comptes.length })}
                    </div>
                )}
            </Card>

            {/* Modal de création/édition */}
            <CompteModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingCompte(null);
                }}
                onSave={handleSave}
                compte={editingCompte}
                isEdit={!!editingCompte}
            />
        </div>
    );
};

export default PlanComptable;