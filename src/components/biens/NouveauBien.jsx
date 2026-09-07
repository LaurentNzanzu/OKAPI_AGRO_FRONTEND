// frontend/src/components/biens/NouveauBien.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { getEtatOptions, getNouveauBienSteps } from '../../utils/i18nBiens';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../common/ImageUpload';
import ConfigInventaireModal from './ConfigInventaireModal';
import { biensService } from '../../services/biens';
import { typesBiensService } from '../../services/typesBiens';
import { localisationsService } from '../../services/localisations';
import { fournisseursService } from '../../services/fournisseurs';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  AppIcon,
  PlusIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  BuildingOffice2Icon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  CubeIcon,
} from '../ui/icons';

// ============================================================
// COMPOSANT : TypeBienSelector
// ============================================================
const TypeBienSelector = ({ types, value, onChange, error, loading, onAddType }) => {
  const { t } = useTranslation();

  // Grouper les types par catégorie (avec icône)
  const getTypeIcon = (code) => {
    const icons = {
      VEHICULE: <TruckIcon className="w-4 h-4" />,
      MACHINE: <BuildingOffice2Icon className="w-4 h-4" />,
      ORDINATEUR: <ComputerDesktopIcon className="w-4 h-4" />,
    };
    return icons[code] || <CubeIcon className="w-4 h-4" />;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
        {t('assets.fieldType')} <span className="text-danger">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {types.map((type) => {
          const typeId = type.id_type_bien ?? type.id;
          const isSelected = Boolean(value) && value === typeId;
          return (
            <button
              key={typeId}
              type="button"
              className={`flex items-center gap-2 px-3 py-2.5 border-2 rounded-xl transition-all text-sm ${isSelected
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-night-muted'
                } ${loading ? 'opacity-50 cursor-wait' : ''}`}
              onClick={() => onChange(typeId)}
              disabled={loading}
            >
              <span className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-slate-400'}>
                {getTypeIcon(type.code)}
              </span>
              <span className={`font-medium text-sm ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-slate-300'}`}>
                {type.libelle}
              </span>
            </button>
          );
        })}
        {/* Bouton pour ajouter un nouveau type de bien */}
        <button
          type="button"
          onClick={onAddType}
          className="flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl transition-all text-sm hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-night-hover text-gray-500 dark:text-slate-400"
        >
          <AppIcon icon={PlusIcon} size="sm" />
          <span className="font-medium text-sm">Nouveau type</span>
        </button>
      </div>
      {error && <span className="text-sm text-danger mt-1">{error}</span>}
      {loading && <span className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('common.loading')}</span>}
    </div>
  );
};

// ============================================================
// COMPOSANT : ChampDynamique (CORRIGÉ)
// ============================================================
const ChampDynamique = ({ champ, value, onChange, error }) => {
  const { t } = useTranslation();
  const fieldName = champ.nom;
  const fieldType = champ.type || 'text';
  const isRequired = champ.obligatoire || false;
  const options = champ.options || [];
  const placeholder = champ.aide || `Saisir ${champ.nom}`;
  const label = champ.label || champ.nom;

  // Rendu selon le type de champ
  switch (fieldType) {
    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label} {isRequired && <span className="text-danger">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
          >
            <option value="">Sélectionnez...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {error && <span className="text-sm text-danger mt-1">{error}</span>}
        </div>
      );

    case 'boolean':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label} {isRequired && <span className="text-danger">*</span>}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={fieldName}
                value="true"
                checked={value === true || value === 'true'}
                onChange={() => onChange(fieldName, true)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">Oui</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={fieldName}
                value="false"
                checked={value === false || value === 'false' || value === '' || value === null || value === undefined}
                onChange={() => onChange(fieldName, false)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">Non</span>
            </label>
          </div>
          {error && <span className="text-sm text-danger mt-1">{error}</span>}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label} {isRequired && <span className="text-danger">*</span>}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            step="0.01"
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
            placeholder={placeholder}
          />
          {error && <span className="text-sm text-danger mt-1">{error}</span>}
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label} {isRequired && <span className="text-danger">*</span>}
          </label>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
          />
          {error && <span className="text-sm text-danger mt-1">{error}</span>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label} {isRequired && <span className="text-danger">*</span>}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            rows={2}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
            placeholder={placeholder}
          />
          {error && <span className="text-sm text-danger mt-1">{error}</span>}
        </div>
      );

    default: // text, email, tel
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {label} {isRequired && <span className="text-danger">*</span>}
          </label>
          <input
            type={fieldType === 'email' ? 'email' : fieldType === 'tel' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(fieldName, e.target.value)}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
            placeholder={placeholder}
          />
          {error && <span className="text-sm text-danger mt-1">{error}</span>}
        </div>
      );
  }
};

// ============================================================
// COMPOSANT : FournisseurModal
// ============================================================
const FournisseurModal = ({ isOpen, onClose, onSave, onDelete, fournisseur, isEdit = false }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ nom: '', adresse: '', telephone: '', email: '', numero_contribuable: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (fournisseur && isEdit) {
      setFormData({
        nom: fournisseur.nom || '',
        adresse: fournisseur.adresse || '',
        telephone: fournisseur.telephone || '',
        email: fournisseur.email || '',
        numero_contribuable: fournisseur.numero_contribuable || '',
      });
    } else {
      setFormData({ nom: '', adresse: '', telephone: '', email: '', numero_contribuable: '' });
    }
    setErrors({});
  }, [fournisseur, isEdit, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = 'Le nom du fournisseur est requis';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await onSave(formData);
      if (result) onClose();
    } catch (err) {
      console.error('Erreur sauvegarde fournisseur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onDelete(fournisseur.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Erreur suppression fournisseur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border-light dark:border-border-dark">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-2">
                <AppIcon icon={isEdit ? PencilSquareIcon : UserPlusIcon} size="sm" />
                {isEdit ? t('assets.editFournisseur') : t('assets.addFournisseur')}
              </span>
            </h3>
            <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-night-hover transition-colors" onClick={onClose}>
              <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-5">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Nom du fournisseur <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.nom ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
                  placeholder="Ex: Toyota RDC, Dell Congo..."
                />
                {errors.nom && <span className="text-sm text-danger mt-1">{errors.nom}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Ex: 123, Avenue de l'Industrie, Kinshasa"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Ex: +243 999 999 999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.email ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
                    placeholder="Ex: contact@fournisseur.com"
                  />
                  {errors.email && <span className="text-sm text-danger mt-1">{errors.email}</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Numéro de contribuable</label>
                <input
                  type="text"
                  value={formData.numero_contribuable}
                  onChange={(e) => handleChange('numero_contribuable', e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Ex: A123456789"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
              {isEdit && (
                <button type="button" className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-danger hover:bg-red-200 rounded-lg transition-colors w-full sm:w-auto" onClick={() => setShowDeleteConfirm(true)}>
                  <AppIcon icon={TrashIcon} size="sm" /> {t('common.delete')}
                </button>
              )}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-night-muted text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-night-hover rounded-lg transition-colors w-full sm:w-auto" onClick={onClose}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto" disabled={submitting}>
                  {submitting ? t('common.saving') : (isEdit ? t('common.update') : t('common.add'))}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('assets.deleteFournisseurTitle')}
        content={t('assets.deleteFournisseurContent', { name: fournisseur?.nom })}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </>
  );
};

// ============================================================
// COMPOSANT : ModePaiementSelector
// ============================================================
const ModePaiementSelector = ({ mode, onChange, errors }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('assets.fieldModePaiement')}</label>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all text-sm sm:text-base ${mode === 'credit' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-night-muted'}`}
          onClick={() => onChange('credit')}
        >
          <AppIcon icon={CreditCardIcon} size="sm" className={mode === 'credit' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-slate-400'} />
          <span className={`font-medium ${mode === 'credit' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-slate-300'}`}>
            {t('assets.modeCredit')}
          </span>
        </button>
        <button
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition-all text-sm sm:text-base ${mode === 'comptant' ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-night-muted'}`}
          onClick={() => onChange('comptant')}
        >
          <AppIcon icon={BanknotesIcon} size="sm" className={mode === 'comptant' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-slate-400'} />
          <span className={`font-medium ${mode === 'comptant' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-slate-300'}`}>
            {t('assets.modeComptant')}
          </span>
        </button>
      </div>
      {errors?.mode_paiement && <span className="text-sm text-danger mt-1">{errors.mode_paiement}</span>}
    </div>
  );
};

// ============================================================
// COMPOSANT : FournisseurAutocomplete
// ============================================================
const FournisseurAutocomplete = ({ value, onChange, onBlur, errors, disabled = false }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editFournisseur, setEditFournisseur] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value) {
      fournisseursService.getById(value)
        .then(f => { setInputValue(f.nom); })
        .catch(() => { setInputValue(''); });
    } else {
      setInputValue('');
    }
  }, [value]);

  const searchFournisseurs = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const results = await fournisseursService.getAll({ search: searchTerm, limit: 10 });
      setSuggestions(results);
    } catch (err) {
      console.error('Erreur recherche fournisseurs:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && inputValue.length >= 1) {
        searchFournisseurs(inputValue);
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, searchFournisseurs]);

  const handleSelect = (fournisseur) => {
    setInputValue(fournisseur.nom);
    onChange(fournisseur.id);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    if (val === '') onChange(null);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (inputValue.length >= 1) searchFournisseurs(inputValue);
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 300);
    if (onBlur) onBlur();
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditFournisseur(null);
    setShowModal(true);
    setIsOpen(false);
  };

  const handleEdit = (fournisseur, e) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditFournisseur(fournisseur);
    setShowModal(true);
    setIsOpen(false);
  };

  const handleSaveFournisseur = async (data) => {
    let result;
    if (isEditMode && editFournisseur) {
      result = await fournisseursService.update(editFournisseur.id, data);
      setSuggestions(prev => prev.map(f => f.id === result.id ? result : f));
      if (value === result.id) setInputValue(result.nom);
    } else {
      result = await fournisseursService.create(data);
      setSuggestions(prev => [result, ...prev]);
    }
    return result;
  };

  const handleDeleteFournisseur = async (id) => {
    await fournisseursService.delete(id);
    setSuggestions(prev => prev.filter(f => f.id !== id));
    if (value === id) onChange(null);
  };

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {t('assets.fieldFournisseur')} <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 dark:text-slate-500">
              <AppIcon icon={MagnifyingGlassIcon} size="sm" />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={t('assets.fournisseurPlaceholder')}
              className={`w-full pl-9 pr-12 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors?.fournisseur_id ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
              disabled={disabled}
              autoComplete="off"
            />
            <button
              type="button"
              className="absolute right-1.5 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
              onClick={handleAddNew}
              title={t('assets.addFournisseur')}
            >
              <AppIcon icon={UserPlusIcon} size="sm" />
            </button>
          </div>
          {isOpen && (suggestions.length > 0 || loading) && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-dropdown max-h-52 overflow-y-auto">
              {loading && <div className="px-4 py-3 text-center text-gray-500 dark:text-slate-400 text-sm">{t('common.loading')}</div>}
              {!loading && suggestions.length === 0 && inputValue.length >= 1 && (
                <div className="px-3 sm:px-4 py-3 text-center">
                  <span className="text-gray-500 dark:text-slate-400 text-sm block">{t('assets.noFournisseurFound')}</span>
                  <button className="mt-2 inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md transition-colors" onClick={handleAddNew}>
                    <AppIcon icon={UserPlusIcon} size="xs" /> {t('assets.addFournisseur')}
                  </button>
                </div>
              )}
              {!loading && suggestions.map((f) => (
                <div key={f.id} className={`flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-night-hover transition-colors ${value === f.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`} onMouseDown={() => handleSelect(f)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate">{f.nom}</div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-500 dark:text-slate-400">
                      {f.telephone && <span>{f.telephone}</span>}
                      {f.email && <span>{f.email}</span>}
                    </div>
                  </div>
                  <button type="button" className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-night-muted text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-2" onClick={(e) => handleEdit(f, e)} title={t('common.edit')}>
                    <AppIcon icon={PencilSquareIcon} size="xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors?.fournisseur_id && <span className="text-sm text-danger mt-1">{errors.fournisseur_id}</span>}
        {value && (
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-success dark:text-green-400">
              <AppIcon icon={CheckCircleIcon} size="xs" /> {t('assets.fournisseurSelected')}
            </span>
          </div>
        )}
      </div>
      <FournisseurModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveFournisseur}
        onDelete={handleDeleteFournisseur}
        fournisseur={editFournisseur}
        isEdit={isEditMode}
      />
    </>
  );
};

// ============================================================
// COMPOSANT : LocalisationModal
// ============================================================
const LocalisationModal = ({ isOpen, onClose, onSave, existingNames = [] }) => {
  const [nomLocalisation, setNomLocalisation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setNomLocalisation(''); setError(''); setSubmitting(false); }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = nomLocalisation.trim();
    if (!trimmed) { setError('Le nom de la localisation est requis'); return; }
    if (existingNames.some(name => name.toUpperCase() === trimmed.toUpperCase())) { setError('Cette localisation existe déjà'); return; }
    setSubmitting(true);
    try {
      const result = await onSave({ nom_localisation: trimmed });
      if (result) onClose();
    } catch (err) {
      console.error('Erreur création localisation:', err);
      const detail = err.response?.data?.detail;
      let errorMsg = 'Erreur lors de la création';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(d => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMsg = detail.msg || detail.message || JSON.stringify(detail);
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border-light dark:border-border-dark">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2"><AppIcon icon={PlusIcon} size="sm" /> Ajouter une localisation</span>
          </h3>
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-night-hover transition-colors" onClick={onClose}>
            <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Nom de la localisation <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={nomLocalisation}
              onChange={(e) => { setNomLocalisation(e.target.value); setError(''); }}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
              placeholder="Ex: Entrepôt Principal, Bureau 101, Atelier Sud..."
              autoFocus
            />
            {error && <span className="text-sm text-danger mt-1">{error}</span>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-night-muted text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-night-hover rounded-lg transition-colors w-full sm:w-auto" onClick={onClose}>Annuler</button>
            <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto" disabled={submitting}>
              {submitting ? 'Création...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT : TypeBienModal (Modal pour créer un nouveau type)
// ============================================================
const TypeBienModal = ({ isOpen, onClose, onSave, existingNames = [] }) => {
  const [libelle, setLibelle] = useState('');
  const [code, setCode] = useState('');
  const [champs, setChamps] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLibelle('');
      setCode('');
      setChamps([]);
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleAddChamp = () => {
    setChamps(prev => [
      ...prev,
      { id: Date.now(), nom: '', label: '', type: 'text', obligatoire: false, options: '', aide: '' }
    ]);
  };

  const handleRemoveChamp = (id) => {
    setChamps(prev => prev.filter(c => c.id !== id));
  };

  const handleChampChange = (id, field, value) => {
    setChamps(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        // Auto-générer le nom technique à partir du label si le nom n'est pas encore manuellement saisi
        if (field === 'label' && (!c.nom || c.nom === c._autoNom)) {
          const auto = value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
          updated.nom = auto;
          updated._autoNom = auto;
        }
        return updated;
      }
      return c;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = libelle.trim();
    if (!trimmed) {
      setError('Le libellé du type est requis');
      return;
    }
    if (trimmed.length < 2) {
      setError('Le libellé doit comporter au moins 2 caractères');
      return;
    }
    if (existingNames.some(name => name?.toUpperCase() === trimmed.toUpperCase())) {
      setError('Ce type de bien existe déjà');
      return;
    }

    // Nettoyer et formater le code pour respecter le pattern backend ^[A-Z0-9_]+$ (longueur 2 à 20)
    const rawCode = code.trim() || trimmed;
    let formattedCode = rawCode
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 20);

    if (formattedCode.length < 2) {
      formattedCode = (formattedCode + '_TYPE').substring(0, 20);
    }

    // Formater les champs spécifiques
    const formattedChamps = champs
      .map(c => {
        const cleanNom = (c.nom || c.label || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '');

        if (!cleanNom) return null;

        const champObj = {
          nom: cleanNom,
          label: (c.label || c.nom || cleanNom).trim(),
          type: c.type || 'text',
          obligatoire: Boolean(c.obligatoire),
        };

        if (c.aide?.trim()) {
          champObj.aide = c.aide.trim();
        }

        if (c.type === 'select' && c.options) {
          if (Array.isArray(c.options)) {
            champObj.options = c.options;
          } else if (typeof c.options === 'string') {
            champObj.options = c.options.split(',').map(o => o.trim()).filter(Boolean);
          }
        }

        return champObj;
      })
      .filter(Boolean);

    setSubmitting(true);
    try {
      const result = await typesBiensService.create({
        libelle: trimmed,
        code: formattedCode,
        compte_comptable: '2440',
        champs_specifiques: formattedChamps,
        est_actif: true
      });
      if (result) {
        onSave(result);
        onClose();
      }
    } catch (err) {
      console.error('Erreur création type de bien:', err);
      const detail = err.response?.data?.detail;

      let errorMsg = 'Erreur lors de la création';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(d => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMsg = detail.msg || detail.message || JSON.stringify(detail);
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border-light dark:border-border-dark sticky top-0 bg-white dark:bg-surface-dark z-10">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2"><AppIcon icon={PlusIcon} size="sm" /> Ajouter un type de bien</span>
          </h3>
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-night-hover transition-colors" onClick={onClose}>
            <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Libellé du type <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={libelle}
                onChange={(e) => { setLibelle(e.target.value); setError(''); }}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
                placeholder="Ex: Ordinateur, Véhicule..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Code (optionnel)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Ex: ORDINATEUR"
              />
            </div>
          </div>

          {/* Section Caractéristiques Spécifiques */}
          <div className="pt-2 border-t border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Caractéristiques spécifiques (optionnelles)
                </h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Champs dynamiques demandés lors de la saisie d'un bien de ce type (Étape 3)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddChamp}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <AppIcon icon={PlusIcon} size="xs" />
                Ajouter un champ
              </button>
            </div>

            {champs.length > 0 ? (
              <div className="space-y-3 mt-3">
                {champs.map((c, index) => (
                  <div key={c.id} className="p-3 bg-gray-50 dark:bg-night-hover/40 rounded-lg border border-border-light dark:border-border-dark space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Champ #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChamp(c.id)}
                        className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                        title="Supprimer ce champ"
                      >
                        <AppIcon icon={TrashIcon} size="xs" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-slate-400 mb-0.5">
                          Nom affiché (Label) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={c.label}
                          onChange={(e) => handleChampChange(c.id, 'label', e.target.value)}
                          placeholder="Ex: Processeur, RAM..."
                          className="w-full px-2.5 py-1.5 text-xs border border-border-light dark:border-border-dark rounded-md bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-slate-400 mb-0.5">
                          Type de donnée
                        </label>
                        <select
                          value={c.type}
                          onChange={(e) => handleChampChange(c.id, 'type', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-border-light dark:border-border-dark rounded-md bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100"
                        >
                          <option value="text">Texte</option>
                          <option value="number">Nombre</option>
                          <option value="date">Date</option>
                          <option value="select">Liste déroulante</option>
                          <option value="boolean">Oui / Non</option>
                          <option value="textarea">Texte long</option>
                        </select>
                      </div>
                    </div>

                    {c.type === 'select' && (
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-slate-400 mb-0.5">
                          Options (séparées par une virgule)
                        </label>
                        <input
                          type="text"
                          value={c.options}
                          onChange={(e) => handleChampChange(c.id, 'options', e.target.value)}
                          placeholder="Ex: 8 Go, 16 Go, 32 Go"
                          className="w-full px-2.5 py-1.5 text-xs border border-border-light dark:border-border-dark rounded-md bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={c.obligatoire}
                          onChange={(e) => handleChampChange(c.id, 'obligatoire', e.target.checked)}
                          className="rounded border-border-light dark:border-border-dark text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                        />
                        Champ obligatoire
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-2">
                Aucun champ spécifique configuré pour l'instant.
              </p>
            )}
          </div>

          {error && <span className="text-sm text-danger block mt-1">{error}</span>}

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-night-muted text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-night-hover rounded-lg transition-colors w-full sm:w-auto text-sm" onClick={onClose}>Annuler</button>
            <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto text-sm" disabled={submitting}>
              {submitting ? 'Création...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT : ModalAjoutSimple (pour Marque, Modèle, Fabricant, Processeur)
// ============================================================
const ModalAjoutSimple = ({ isOpen, title, label, value, onChange, onSave, onClose, error, existingValues = [] }) => {
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setLocalError('Ce champ est requis');
      return;
    }
    if (existingValues.some(v => v.toUpperCase() === trimmed.toUpperCase())) {
      setLocalError('Cette valeur existe déjà');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(trimmed);
      onClose();
    } catch (err) {
      console.error('Erreur création:', err);
      setLocalError(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md shadow-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border-light dark:border-border-dark">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100">
            <span className="inline-flex items-center gap-2">
              <AppIcon icon={PlusIcon} size="sm" /> {title}
            </span>
          </h3>
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-night-hover transition-colors" onClick={onClose}>
            <AppIcon icon={XMarkIcon} size="md" className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {label} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => { onChange(e.target.value); setLocalError(''); }}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${localError || error ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
              placeholder={`Ex: ${label}...`}
              autoFocus
            />
            {(localError || error) && <span className="text-sm text-danger mt-1">{localError || error}</span>}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-night-muted text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-night-hover rounded-lg transition-colors w-full sm:w-auto" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto" disabled={submitting}>
              {submitting ? 'Création...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL : NouveauBien
// ============================================================
const NouveauBien = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- États principaux ---
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // --- États pour les données de l'API ---
  const [typesBiens, setTypesBiens] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [localisations, setLocalisations] = useState([]);
  const [localisationsLoading, setLocalisationsLoading] = useState(true);

  // --- États pour les options de champs (création rapide) ---
  const [marqueOptions, setMarqueOptions] = useState([]);
  const [modeleOptions, setModeleOptions] = useState([]);
  const [fabricantOptions, setFabricantOptions] = useState([]);
  const [processeurOptions, setProcesseurOptions] = useState([]);

  // --- États pour les modals de création rapide ---
  const [showNewMarque, setShowNewMarque] = useState(false);
  const [showNewModele, setShowNewModele] = useState(false);
  const [showNewFabricant, setShowNewFabricant] = useState(false);
  const [showNewProcesseur, setShowNewProcesseur] = useState(false);
  const [showNewLocalisation, setShowNewLocalisation] = useState(false);
  const [showNewTypeBien, setShowNewTypeBien] = useState(false);

  // --- États pour les valeurs des champs de création rapide ---
  const [newMarqueValue, setNewMarqueValue] = useState('');
  const [newModeleValue, setNewModeleValue] = useState('');
  const [newFabricantValue, setNewFabricantValue] = useState('');
  const [newProcesseurValue, setNewProcesseurValue] = useState('');
  const [newLocalisationValue, setNewLocalisationValue] = useState('');

  // --- État du formulaire principal ---
  const [formData, setFormData] = useState({
    // Étape 1 : Informations générales
    id_type_bien: null,
    libelle: '',
    // description supprimée
    numero_serie: '',
    numero_inventaire: '',
    date_acquisition: '',
    prix_acquisition: '',
    etat: 'BON', // Valeur par défaut modifiée de 'bon' à 'BON'
    mode_paiement: 'comptant', // credit, comptant

    // Étape 2 : Fournisseur & Localisation
    fournisseur_id: null,
    id_localisation: '',
    // Champs spécifiques au type de bien (attributs_specifiques)
    attributs_specifiques: {},

    // Étape 3 : Champs spécifiques selon le type
    // Les champs spécifiques sont gérés dynamiquement dans attributs_specifiques
  });

  // --- États pour les images et la config inventaire ---
  const [imagesFiles, setImagesFiles] = useState([]);
  const [showConfigInventaire, setShowConfigInventaire] = useState(false);

  // --- États de validation ---
  const [fieldErrors, setFieldErrors] = useState({});
  const [stepErrors, setStepErrors] = useState({});

  // --- État pour le type de bien sélectionné (avec ses champs) ---
  const [selectedType, setSelectedType] = useState(null);

  // --- État pour les champs dynamiques à afficher ---
  const [dynamicFields, setDynamicFields] = useState([]);

  // ============================================================
  // CHARGEMENT DES DONNÉES INITIALES
  // ============================================================
  useEffect(() => {
    const loadInitialData = async () => {
      setTypesLoading(true);
      setLocalisationsLoading(true);
      try {
        // Charger les types de biens actifs
        const types = await typesBiensService.getAllActifs();
        setTypesBiens(types);

        // Charger les localisations
        const locs = await localisationsService.getAll();
        setLocalisations(locs);

        // Charger les options pour les champs de sélection rapide
        try {
          const marques = await biensService.getMarques();
          setMarqueOptions(marques.map(m => m.nom || m));
        } catch (e) { /* ignore */ }

        try {
          const modeles = await biensService.getModeles();
          setModeleOptions(modeles.map(m => m.nom || m));
        } catch (e) { /* ignore */ }

        try {
          const fabricants = await biensService.getFabricants();
          setFabricantOptions(fabricants.map(f => f.nom || f));
        } catch (e) { /* ignore */ }

        try {
          const processeurs = await biensService.getProcesseurs();
          setProcesseurOptions(processeurs.map(p => p.nom || p));
        } catch (e) { /* ignore */ }

      } catch (err) {
        console.error('Erreur chargement données initiales:', err);
        setError('Impossible de charger les données nécessaires');
      } finally {
        setTypesLoading(false);
        setLocalisationsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ============================================================
  // EFFET : Mise à jour des champs dynamiques quand le type change
  // ============================================================
  useEffect(() => {
    if (formData.id_type_bien) {
      const type = typesBiens.find(t => (t.id_type_bien ?? t.id) === formData.id_type_bien);
      setSelectedType(type || null);

      if (type && type.champs_specifiques) {
        // S'assurer que champs_specifiques est un tableau (gestion du cas où c'est une string JSON)
        let champs = type.champs_specifiques;
        if (typeof champs === 'string') {
          try {
            champs = JSON.parse(champs);
          } catch (e) {
            champs = [];
          }
        }

        if (Array.isArray(champs)) {
          setDynamicFields(champs);

          const initialAttrs = {};
          champs.forEach(champ => {
            if (champ.valeur_par_defaut !== undefined && champ.valeur_par_defaut !== null) {
              initialAttrs[champ.nom] = champ.valeur_par_defaut;
            } else if (champ.type === 'boolean') {
              initialAttrs[champ.nom] = false;
            } else {
              initialAttrs[champ.nom] = '';
            }
          });
          setFormData(prev => ({
            ...prev,
            attributs_specifiques: { ...prev.attributs_specifiques, ...initialAttrs }
          }));
        } else {
          setDynamicFields([]);
        }
      } else {
        setDynamicFields([]);
      }
    } else {
      setSelectedType(null);
      setDynamicFields([]);
    }
  }, [formData.id_type_bien, typesBiens]);

  // ============================================================
  // GESTION DES CHAMPS DYNAMIQUES
  // ============================================================
  const handleDynamicFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      attributs_specifiques: {
        ...prev.attributs_specifiques,
        [fieldName]: value
      }
    }));
    // Effacer l'erreur du champ si elle existe
    if (fieldErrors[`attr_${fieldName}`]) {
      setFieldErrors(prev => ({ ...prev, [`attr_${fieldName}`]: null }));
    }
  };

  // ============================================================
  // GESTION DU FORMULAIRE
  // ============================================================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTypeChange = (typeId) => {
    // Récupérer l'objet complet du type sélectionné
    const fullType = typesBiens.find(t => (t.id_type_bien ?? t.id) === typeId);
    setSelectedType(fullType || null);

    // Initialiser les champs dynamiques et leurs valeurs par défaut
    let champs = fullType?.champs_specifiques || [];
    if (typeof champs === 'string') {
      try {
        champs = JSON.parse(champs);
      } catch (e) {
        champs = [];
      }
    }

    const initialAttrs = {};
    if (Array.isArray(champs)) {
      setDynamicFields(champs);
      champs.forEach(champ => {
        if (champ.valeur_par_defaut !== undefined && champ.valeur_par_defaut !== null) {
          initialAttrs[champ.nom] = champ.valeur_par_defaut;
        } else if (champ.type === 'boolean') {
          initialAttrs[champ.nom] = false;
        } else {
          initialAttrs[champ.nom] = '';
        }
      });
    } else {
      setDynamicFields([]);
    }

    // Réinitialiser les attributs spécifiques quand on change de type
    setFormData(prev => ({
      ...prev,
      id_type_bien: typeId,
      attributs_specifiques: initialAttrs
    }));
    if (fieldErrors.id_type_bien) {
      setFieldErrors(prev => ({ ...prev, id_type_bien: null }));
    }
  };

  // ============================================================
  // VALIDATION DES ÉTAPES
  // ============================================================
  const validateStep1 = () => {
    const errors = {};
    if (!formData.id_type_bien) errors.id_type_bien = 'Veuillez sélectionner un type de bien';
    if (!formData.libelle?.trim()) errors.libelle = 'Le libellé est requis';
    if (!formData.date_acquisition) errors.date_acquisition = 'La date d\'acquisition est requise';
    if (!formData.prix_acquisition) {
      errors.prix_acquisition = 'Le prix d\'acquisition est requis';
    } else if (isNaN(parseFloat(formData.prix_acquisition)) || parseFloat(formData.prix_acquisition) <= 0) {
      errors.prix_acquisition = 'Le prix doit être un nombre positif';
    }
    if (!formData.mode_paiement) errors.mode_paiement = 'Veuillez sélectionner un mode de paiement';

    // Valider aussi les champs spécifiques obligatoires s'ils sont affichés
    dynamicFields.forEach(champ => {
      if (champ.obligatoire) {
        const value = formData.attributs_specifiques?.[champ.nom];
        if (value === undefined || value === null || value === '' || (champ.type === 'boolean' && (value === undefined || value === null))) {
          errors[`attr_${champ.nom}`] = `Le champ "${champ.label || champ.nom}" est obligatoire`;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.fournisseur_id) errors.fournisseur_id = 'Veuillez sélectionner un fournisseur';
    if (!formData.id_localisation) errors.id_localisation = 'Veuillez sélectionner une localisation';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    // Valider les champs spécifiques obligatoires
    dynamicFields.forEach(champ => {
      if (champ.obligatoire) {
        const value = formData.attributs_specifiques?.[champ.nom];
        if (value === undefined || value === null || value === '' || (champ.type === 'boolean' && (value === undefined || value === null))) {
          errors[`attr_${champ.nom}`] = `Le champ "${champ.label || champ.nom}" est obligatoire`;
        }
      }
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================
  // NAVIGATION ENTRE ÉTAPES
  // ============================================================
  const nextStep = () => {
    let valid = true;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else if (step === 3) valid = validateStep3();

    if (valid) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // ============================================================
  // SOUMISSION DU FORMULAIRE (MODIFIÉE)
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider toutes les étapes avant soumission
    const valid1 = validateStep1();
    const valid2 = validateStep2();
    const valid3 = validateStep3();

    if (!valid1 || !valid2 || !valid3) {
      // Aller à la première étape qui a des erreurs
      if (!valid1) setStep(1);
      else if (!valid2) setStep(2);
      else if (!valid3) setStep(3);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Construction du FormData
      const fd = new FormData();
      fd.append('libelle', formData.libelle);
      fd.append('id_type_bien', formData.id_type_bien);
      fd.append('date_acquisition', formData.date_acquisition);
      fd.append('prix_acquisition', formData.prix_acquisition);
      fd.append('etat', formData.etat);
      fd.append('id_localisation', formData.id_localisation);
      fd.append('mode_paiement', formData.mode_paiement);
      if (formData.fournisseur_id) fd.append('fournisseur_id', formData.fournisseur_id);
      if (formData.numero_serie?.trim()) fd.append('numero_serie', formData.numero_serie.trim());
      if (formData.numero_inventaire?.trim()) fd.append('numero_inventaire', formData.numero_inventaire.trim());
      if (formData.attributs_specifiques && Object.keys(formData.attributs_specifiques).length > 0) {
        fd.append('attributs_specifiques', JSON.stringify(formData.attributs_specifiques));
      }

      // Ajouter les fichiers images
      for (const file of imagesFiles) {
        fd.append('images', file);
      }

      const result = await biensService.createWithImages(fd);

      // Rediriger vers la page du bien créé
      navigate(`/biens/${result.id_bien}`);
    } catch (err) {
      console.error('Erreur création du bien:', err);
      const detail = err.response?.data?.detail;
      let errorMsg = 'Une erreur est survenue lors de la création du bien';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(d => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMsg = detail.msg || detail.message || JSON.stringify(detail);
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // GESTION DE L'ANNULATION
  // ============================================================
  const handleCancel = () => {
    setShowConfirmDialog(true);
  };

  const confirmCancel = () => {
    setShowConfirmDialog(false);
    navigate('/biens');
  };

  // ============================================================
  // GESTION DES CRÉATIONS RAPIDES (Marque, Modèle, Fabricant, Processeur)
  // ============================================================
  const handleQuickAdd = async (type, value, setOptions) => {
    try {
      let result;
      switch (type) {
        case 'marque':
          result = await biensService.createMarque({ nom: value.trim() });
          setMarqueOptions(prev => [...prev, result.nom]);
          break;
        case 'modele':
          result = await biensService.createModele({ nom: value.trim() });
          setModeleOptions(prev => [...prev, result.nom]);
          break;
        case 'fabricant':
          result = await biensService.createFabricant({ nom: value.trim() });
          setFabricantOptions(prev => [...prev, result.nom]);
          break;
        case 'processeur':
          result = await biensService.createProcesseur({ nom: value.trim() });
          setProcesseurOptions(prev => [...prev, result.nom]);
          break;
        default:
          break;
      }
      return result;
    } catch (err) {
      console.error(`Erreur création ${type}:`, err);
      throw err;
    }
  };

  // ============================================================
  // GESTION DE LA CRÉATION RAPIDE DE LOCALISATION
  // ============================================================
  const handleQuickAddLocalisation = async (nom) => {
    try {
      const result = await localisationsService.create({ nom_localisation: nom.trim() });
      setLocalisations(prev => [...prev, result]);
      // Sélectionner automatiquement la nouvelle localisation
      setFormData(prev => ({ ...prev, id_localisation: result.id_localisation }));
      return result;
    } catch (err) {
      console.error('Erreur création localisation:', err);
      throw err;
    }
  };

  const handleQuickAddTypeBien = (newType) => {
    setTypesBiens(prev => [...prev, newType]);
    // Sélectionner automatiquement le nouveau type créé
    const newTypeId = newType.id_type_bien ?? newType.id;
    setFormData(prev => ({ ...prev, id_type_bien: newTypeId }));
  };

  // ============================================================
  // RENDU : ÉTAPES DU FORMULAIRE
  // ============================================================
  const steps = [
    { id: 1, label: 'Informations générales', icon: <ClipboardDocumentListIcon className="w-4 h-4" /> },
    { id: 2, label: 'Fournisseur & Localisation', icon: <TruckIcon className="w-4 h-4" /> },
    { id: 3, label: 'Caractéristiques', icon: <ComputerDesktopIcon className="w-4 h-4" /> },
  ];

  // ============================================================
  // RENDU : ÉTAPE 1 - INFORMATIONS GÉNÉRALES (MODIFIÉE)
  // ============================================================
  const renderStep1 = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* Type de bien */}
      <TypeBienSelector
        types={typesBiens}
        value={formData.id_type_bien}
        onChange={handleTypeChange}
        error={fieldErrors.id_type_bien}
        loading={typesLoading}
        onAddType={() => setShowNewTypeBien(true)}
      />

      {/* Libellé */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {t('assets.fieldLibelle')} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={formData.libelle}
          onChange={(e) => handleChange('libelle', e.target.value)}
          className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${fieldErrors.libelle ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
          placeholder="Ex: Camion Toyota Hilux 2024"
        />
        {fieldErrors.libelle && <span className="text-sm text-danger mt-1">{fieldErrors.libelle}</span>}
      </div>

      {/* Photos (remplace description) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          Photos du bien (max 4)
        </label>
        <ImageUpload
          maxFiles={4}
          maxSizeMB={1}
          onChange={setImagesFiles}
          errors={fieldErrors.images}
        />
      </div>

      {/* Numéro de série */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {t('assets.fieldNumeroSerie')}
        </label>
        <input
          type="text"
          value={formData.numero_serie}
          onChange={(e) => handleChange('numero_serie', e.target.value)}
          className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="Ex: 1HGCM82633A123456"
        />
      </div>

      {/* Numéro d'inventaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {t('assets.fieldNumeroInventaire')}
        </label>
        <input
          type="text"
          value={formData.numero_inventaire}
          onChange={(e) => handleChange('numero_inventaire', e.target.value)}
          className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          placeholder="Ex: INV-2024-001"
        />
      </div>

      {/* Spécifications spécifiques dynamiques selon le type de bien */}
      {selectedType && dynamicFields && dynamicFields.length > 0 && (
        <div className="p-4 sm:p-5 bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-200 dark:border-primary-800/60 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
              Spécifications pour {selectedType.libelle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Caractéristiques techniques spécifiques à ce type d'équipement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {dynamicFields.map((champ) => (
              <div key={champ.nom} className={champ.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <ChampDynamique
                  champ={champ}
                  value={formData.attributs_specifiques?.[champ.nom] ?? ''}
                  onChange={handleDynamicFieldChange}
                  error={fieldErrors[`attr_${champ.nom}`]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date et prix d'acquisition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {t('assets.fieldDateAcquisition')} <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            value={formData.date_acquisition}
            onChange={(e) => handleChange('date_acquisition', e.target.value)}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${fieldErrors.date_acquisition ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
          />
          {fieldErrors.date_acquisition && <span className="text-sm text-danger mt-1">{fieldErrors.date_acquisition}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {t('assets.fieldPrixAcquisition')} <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.prix_acquisition}
            onChange={(e) => handleChange('prix_acquisition', e.target.value)}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${fieldErrors.prix_acquisition ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
            placeholder="Ex: 45000.00"
          />
          {fieldErrors.prix_acquisition && <span className="text-sm text-danger mt-1">{fieldErrors.prix_acquisition}</span>}
        </div>
      </div>

      {/* État - Nouvelle liste d'options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {t('assets.fieldEtat')} <span className="text-danger">*</span>
        </label>
        <select
          value={formData.etat}
          onChange={(e) => handleChange('etat', e.target.value)}
          className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        >
          <option value="NEUF">Neuf</option>
          <option value="BON">Bon</option>
          <option value="USAGE">Usagé</option>
          <option value="PANNE">En Panne</option>
          <option value="MAINTENANCE">En Maintenance</option>
          <option value="EN_TEST">En Test</option>
          <option value="REFORME">Réformé</option>
        </select>
      </div>

      {/* Mode de paiement */}
      <ModePaiementSelector
        mode={formData.mode_paiement}
        onChange={(val) => handleChange('mode_paiement', val)}
        errors={fieldErrors}
      />
    </div>
  );

  // ============================================================
  // RENDU : ÉTAPE 2 - FOURNISSEUR & LOCALISATION
  // ============================================================
  const renderStep2 = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* Fournisseur */}
      <FournisseurAutocomplete
        value={formData.fournisseur_id}
        onChange={(val) => handleChange('fournisseur_id', val)}
        errors={fieldErrors}
      />

      {/* Localisation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {t('assets.fieldLocalisation')} <span className="text-danger">*</span>
        </label>
        <div className="relative flex items-center">
          <select
            value={formData.id_localisation || ''}
            onChange={(e) => handleChange('id_localisation', parseInt(e.target.value) || '')}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${fieldErrors.id_localisation ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}
            disabled={localisationsLoading}
          >
            <option value="">Sélectionnez une localisation...</option>
            {localisations.map((loc) => (
              <option key={loc.id_localisation} value={loc.id_localisation}>
                {loc.nom_localisation}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="absolute right-1.5 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            onClick={() => setShowNewLocalisation(true)}
            title="Ajouter une localisation"
          >
            <AppIcon icon={PlusIcon} size="sm" />
          </button>
        </div>
        {fieldErrors.id_localisation && <span className="text-sm text-danger mt-1">{fieldErrors.id_localisation}</span>}
        {localisationsLoading && <span className="text-sm text-gray-500 dark:text-slate-400 mt-1">Chargement des localisations...</span>}
      </div>
    </div>
  );

  // ============================================================
  // RENDU : ÉTAPE 3 - CHAMPS SPÉCIFIQUES
  // ============================================================
  const renderStep3 = () => {
    if (!selectedType) {
      return (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-warning-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-slate-400">
            Veuillez sélectionner un type de bien à l'étape 1 pour voir les caractéristiques spécifiques.
          </p>
        </div>
      );
    }

    if (!dynamicFields || dynamicFields.length === 0) {
      return (
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 text-success-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-slate-300 font-medium">
            Ce type de bien (<span className="text-primary-600 dark:text-primary-400">{selectedType.libelle}</span>) ne possède pas de caractéristiques spécifiques obligatoires.
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
            Vous pouvez finaliser et créer votre bien directement.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base mb-1">
            Spécifications pour {selectedType.libelle}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
            Renseignez les attributs techniques et caractéristiques propres à ce type d'équipement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dynamicFields.map((champ) => (
            <div key={champ.nom} className={champ.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <ChampDynamique
                champ={champ}
                value={formData.attributs_specifiques?.[champ.nom] ?? ''}
                onChange={handleDynamicFieldChange}
                error={fieldErrors[`attr_${champ.nom}`]}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* En-tête avec bouton Configurer inventaire */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
              {t('assets.addNewAsset')}
            </h1>
            <button
              type="button"
              onClick={() => setShowConfigInventaire(true)}
              className="text-sm text-primary-600 hover:underline"
            >
              Configurer numéro d'inventaire
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t('assets.addAssetDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-night-hover transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('common.back')}
        </button>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => {
                // Permettre de naviguer seulement vers les étapes précédentes ou l'étape courante
                if (s.id <= step) {
                  setStep(s.id);
                }
              }}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors ${s.id === step
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : s.id < step
                  ? 'text-success-600 dark:text-success-400 hover:bg-gray-100 dark:hover:bg-night-hover'
                  : 'text-gray-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              disabled={s.id > step}
            >
              <span className={`text-sm font-medium ${s.id === step ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                {s.id < step ? <CheckCircleIcon className="w-4 h-4 text-success-500" /> : s.icon}
              </span>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">{s.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${s.id < step ? 'bg-success-500' : 'bg-gray-200 dark:bg-night-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Erreur générale */}
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-danger rounded-lg flex items-start gap-2 sm:gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <span className="text-sm text-danger dark:text-red-400">
            {typeof error === 'object' ? JSON.stringify(error) : error}
          </span>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-card p-4 sm:p-6">
        {/* Étape 1 */}
        {step === 1 && renderStep1()}

        {/* Étape 2 */}
        {step === 2 && renderStep2()}

        {/* Étape 3 */}
        {step === 3 && renderStep3()}

        {/* Boutons de navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-night-hover transition-colors w-full sm:w-auto"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t('common.previous')}
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-full sm:w-auto"
              >
                {t('common.next')}
                <span className="text-lg">→</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    {t('common.save')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modals de création rapide */}
      <ModalAjoutSimple
        isOpen={showNewMarque}
        title="Nouvelle marque"
        label="Nom de la marque"
        value={newMarqueValue}
        onChange={setNewMarqueValue}
        onSave={() => handleQuickAdd('marque', newMarqueValue, setMarqueOptions)}
        onClose={() => { setShowNewMarque(false); setNewMarqueValue(''); }}
        existingValues={marqueOptions}
      />

      <ModalAjoutSimple
        isOpen={showNewModele}
        title="Nouveau modèle"
        label="Nom du modèle"
        value={newModeleValue}
        onChange={setNewModeleValue}
        onSave={() => handleQuickAdd('modele', newModeleValue, setModeleOptions)}
        onClose={() => { setShowNewModele(false); setNewModeleValue(''); }}
        existingValues={modeleOptions}
      />

      <ModalAjoutSimple
        isOpen={showNewFabricant}
        title="Nouveau fabricant"
        label="Nom du fabricant"
        value={newFabricantValue}
        onChange={setNewFabricantValue}
        onSave={() => handleQuickAdd('fabricant', newFabricantValue, setFabricantOptions)}
        onClose={() => { setShowNewFabricant(false); setNewFabricantValue(''); }}
        existingValues={fabricantOptions}
      />

      <ModalAjoutSimple
        isOpen={showNewProcesseur}
        title="Nouveau processeur"
        label="Nom du processeur"
        value={newProcesseurValue}
        onChange={setNewProcesseurValue}
        onSave={() => handleQuickAdd('processeur', newProcesseurValue, setProcesseurOptions)}
        onClose={() => { setShowNewProcesseur(false); setNewProcesseurValue(''); }}
        existingValues={processeurOptions}
      />

      <LocalisationModal
        isOpen={showNewLocalisation}
        onClose={() => { setShowNewLocalisation(false); setNewLocalisationValue(''); }}
        onSave={handleQuickAddLocalisation}
        existingNames={localisations.map(l => l.nom_localisation)}
      />

      {/* Modal Nouveau Type de Bien */}
      <TypeBienModal
        isOpen={showNewTypeBien}
        onClose={() => setShowNewTypeBien(false)}
        onSave={handleQuickAddTypeBien}
        existingNames={typesBiens.map(t => t.libelle)}
      />

      {/* Modal de configuration inventaire */}
      <ConfigInventaireModal
        isOpen={showConfigInventaire}
        onClose={() => setShowConfigInventaire(false)}
        onSave={() => {
          // Optionnel : rafraîchir ou afficher un message
        }}
      />

      {/* Dialog de confirmation d'annulation */}
      <ConfirmDialog
        open={showConfirmDialog}
        title={t('common.confirmCancel')}
        content={t('assets.confirmCancelContent')}
        onConfirm={confirmCancel}
        onCancel={() => setShowConfirmDialog(false)}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="warning"
      />
    </div>
  );
};

export default NouveauBien;