// frontend/src/components/budgets/GestionBudgets.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { budgetsService } from '../../services/budgets';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  WalletIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';
import { formatPrice } from '../../utils/formatters';

// ============================================================
// COMPOSANT : BudgetModal
// ============================================================
const BudgetModal = ({ isOpen, onClose, onSave, budget = null, existingCentres = [] }) => {
  const { t } = useTranslation();
  
  // État local pour gérer le choix entre sélection et saisie personnalisée
  const [isCustomCentre, setIsCustomCentre] = useState(false);
  const [formData, setFormData] = useState({
    centre_cout: '',
    exercice: new Date().getFullYear(),
    montant_alloue: '',
    montant_utilise: '0',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budget) {
      // Mode édition : on pré-remplit avec les données existantes
      setFormData({
        centre_cout: budget.centre_cout,
        exercice: budget.exercice,
        montant_alloue: String(budget.montant_alloue),
        montant_utilise: String(budget.montant_utilise || 0),
      });
      // En mode édition, on force le mode sélection si le centre existe dans la liste
      setIsCustomCentre(!existingCentres.includes(budget.centre_cout));
    } else {
      // Mode création : par défaut, sélectionner le premier centre existant s'il y en a
      const defaultCentre = existingCentres.length > 0 ? existingCentres[0] : '';
      setFormData({
        centre_cout: defaultCentre,
        exercice: new Date().getFullYear(),
        montant_alloue: '',
        montant_utilise: '0',
      });
      // Si aucun centre existant, passer directement en mode saisie personnalisée
      setIsCustomCentre(existingCentres.length === 0);
    }
    setErrors({});
  }, [budget, isOpen, existingCentres]);

  if (!isOpen) return null;

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      // L'utilisateur veut ajouter un nouveau centre
      setIsCustomCentre(true);
      setFormData(prev => ({ ...prev, centre_cout: '' }));
    } else {
      // L'utilisateur sélectionne un centre existant
      setIsCustomCentre(false);
      handleChange('centre_cout', val);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.centre_cout.trim()) newErrors.centre_cout = t('budgets.errors.centreRequired');
    if (!formData.exercice || formData.exercice < 2000) newErrors.exercice = t('budgets.errors.exerciceInvalid');
    if (!formData.montant_alloue || parseFloat(formData.montant_alloue) <= 0) {
      newErrors.montant_alloue = t('budgets.errors.montantRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        centre_cout: formData.centre_cout.trim(),
        exercice: parseInt(formData.exercice),
        montant_alloue: parseFloat(formData.montant_alloue),
        montant_utilise: parseFloat(formData.montant_utilise) || 0,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Erreur sauvegarde budget:', err);
      setErrors({ submit: err.response?.data?.detail || t('budgets.errors.saveError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* En-tête du modal */}
        <div className="flex justify-between items-center p-5 border-b border-border-light dark:border-border-dark">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {budget ? t('budgets.edit') : t('budgets.new')}
          </h3>
          <button 
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-night-hover transition-colors" 
            onClick={onClose}
            type="button"
          >
            <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* CHAMP CENTRE DE COÛT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('budgets.centreCout')} <span className="text-danger">*</span>
            </label>

            {!isCustomCentre ? (
              // Mode : Sélection dans une liste déroulante
              <div className="space-y-2">
                <select
                  value={formData.centre_cout}
                  onChange={handleSelectChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    errors.centre_cout ? 'border-danger' : 'border-border-light dark:border-border-dark'
                  }`}
                >
                  <option value="" disabled>Sélectionner un centre de coût</option>
                  {existingCentres.map((centre) => (
                    <option key={centre} value={centre}>
                      {centre}
                    </option>
                  ))}
                  <option value="__NEW__" className="font-semibold text-primary-600">
                    + Ajouter un nouveau centre de coût...
                  </option>
                </select>
                {existingCentres.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Aucun centre de coût existant. Cliquez sur "Ajouter un nouveau centre de coût..." pour en créer un.
                  </p>
                )}
              </div>
            ) : (
              // Mode : Saisie personnalisée d'un nouveau centre
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.centre_cout}
                    onChange={(e) => handleChange('centre_cout', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      errors.centre_cout ? 'border-danger' : 'border-border-light dark:border-border-dark'
                    }`}
                    placeholder={t('budgets.centrePlaceholder')}
                    autoFocus
                  />
                  {existingCentres.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsCustomCentre(false);
                        // Réinitialiser avec le premier centre existant
                        if (existingCentres.length > 0) {
                          handleChange('centre_cout', existingCentres[0]);
                        }
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Saisissez le nom du nouveau centre de coût, puis enregistrez le budget.
                </p>
              </div>
            )}
            {errors.centre_cout && <span className="text-sm text-danger mt-1">{errors.centre_cout}</span>}
          </div>

          {/* EXERCICE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('budgets.exercice')} <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={formData.exercice}
              onChange={(e) => handleChange('exercice', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.exercice ? 'border-danger' : 'border-border-light dark:border-border-dark'
              }`}
              min="2000"
              max="2100"
            />
            {errors.exercice && <span className="text-sm text-danger mt-1">{errors.exercice}</span>}
          </div>

          {/* MONTANT ALLOUÉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {t('budgets.montantAlloue')} <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              value={formData.montant_alloue}
              onChange={(e) => handleChange('montant_alloue', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                errors.montant_alloue ? 'border-danger' : 'border-border-light dark:border-border-dark'
              }`}
              placeholder="0"
              min="0"
              step="0.01"
            />
            {errors.montant_alloue && <span className="text-sm text-danger mt-1">{errors.montant_alloue}</span>}
          </div>

          {/* MONTANT UTILISÉ (lecture seule) */}
          {budget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {t('budgets.montantUtilise')}
              </label>
              <input
                type="number"
                value={formData.montant_utilise}
                onChange={(e) => handleChange('montant_utilise', e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-gray-50 dark:bg-night-active text-gray-900 dark:text-slate-100 cursor-not-allowed"
                disabled
              />
            </div>
          )}

          {/* ERREUR SUBMIT */}
          {errors.submit && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {errors.submit}
            </div>
          )}

          {/* BOUTONS D'ACTION */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" isLoading={loading} disabled={loading}>
              {budget ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL : GestionBudgets
// ============================================================
const GestionBudgets = () => {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExercice, setSelectedExercice] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [synthese, setSynthese] = useState(null);

  useEffect(() => {
    fetchBudgets();
  }, [selectedExercice]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [listData, syntheseData] = await Promise.all([
        budgetsService.getAll({ exercice: selectedExercice }),
        budgetsService.getSynthese(selectedExercice).catch(() => null)
      ]);
      setBudgets(listData || []);
      setSynthese(syntheseData);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement budgets:', err);
      setError(err.response?.data?.detail || t('budgets.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Extraction de la liste unique des centres de coût à partir des budgets chargés
  const centresDeCout = Array.from(new Set(budgets.map(b => b.centre_cout))).filter(Boolean);

  const handleCreate = async (data) => {
    await budgetsService.create(data);
    await fetchBudgets();
  };

  const handleUpdate = async (data) => {
    await budgetsService.update(editingBudget.id_budget, data);
    setEditingBudget(null);
    await fetchBudgets();
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('budgets.deleteConfirm'))) {
      await budgetsService.delete(id);
      await fetchBudgets();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AppPage>
      <PageHeader
        title={t('budgets.title')}
        subtitle={t('budgets.subtitle')}
        icon={WalletIcon}
        action={
          <Button variant="primary" onClick={() => { setEditingBudget(null); setShowModal(true); }}>
            <AppIcon icon={PlusIcon} size="sm" className="mr-1" />
            {t('budgets.new')}
          </Button>
        }
      />

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Synthèse des budgets */}
      {synthese && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-card text-center">
            <div className="text-2xl font-bold text-primary-600">{formatPrice(synthese.total_alloue)}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('budgets.totalAlloue')}</div>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-card text-center">
            <div className="text-2xl font-bold text-warning">{formatPrice(synthese.total_utilise)}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('budgets.totalUtilise')}</div>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-card text-center">
            <div className="text-2xl font-bold text-success">{formatPrice(synthese.total_disponible)}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('budgets.totalDisponible')}</div>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-card text-center">
            <div className="text-2xl font-bold text-primary-600">{synthese.taux_global_utilisation?.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('budgets.tauxUtilisation')}</div>
          </div>
        </div>
      )}

      {/* Filtre par exercice */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('budgets.exercice')}
        </label>
        <input
          type="number"
          value={selectedExercice}
          onChange={(e) => setSelectedExercice(parseInt(e.target.value) || new Date().getFullYear())}
          className="px-3 py-2 w-32 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          min="2000"
          max="2100"
        />
        <Button variant="secondary" size="sm" onClick={fetchBudgets}>
          {t('common.refresh')}
        </Button>
      </div>

      {/* Liste des budgets */}
      <Card title={t('budgets.list')} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-night-active">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('budgets.centreCout')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('budgets.montantAlloue')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('budgets.montantUtilise')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('budgets.soldeDisponible')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('budgets.tauxUtilisation')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                    {t('budgets.empty')}
                  </td>
                </tr>
              ) : (
                budgets.map((budget) => {
                  const solde = budget.montant_alloue - budget.montant_utilise;
                  const taux = budget.montant_alloue > 0 
                    ? (budget.montant_utilise / budget.montant_alloue) * 100 
                    : 0;
                  const estEpuise = solde <= 0;

                  return (
                    <tr key={budget.id_budget} className="hover:bg-gray-50 dark:hover:bg-night-hover transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">
                        {budget.centre_cout}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-slate-100">
                        {formatPrice(budget.montant_alloue)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                        {formatPrice(budget.montant_utilise)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${estEpuise ? 'text-danger' : 'text-success'}`}>
                        {formatPrice(solde)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-night-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${taux > 90 ? 'bg-danger' : taux > 70 ? 'bg-warning' : 'bg-success'}`}
                              style={{ width: `${Math.min(taux, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                            {taux.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingBudget(budget); setShowModal(true); }}
                            title={t('common.edit')}
                          >
                            <AppIcon icon={PencilSquareIcon} size="sm" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(budget.id_budget)}
                            title={t('common.delete')}
                          >
                            <AppIcon icon={TrashIcon} size="sm" className="text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de création / édition */}
      <BudgetModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingBudget(null); }}
        onSave={editingBudget ? handleUpdate : handleCreate}
        budget={editingBudget}
        existingCentres={centresDeCout}
      />
    </AppPage>
  );
};

export default GestionBudgets;