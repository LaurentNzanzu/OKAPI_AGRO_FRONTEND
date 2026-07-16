import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { getEtatOptions, getTypeBienOptions, getNouveauBienSteps } from '../../utils/i18nBiens';
import { useNavigate } from 'react-router-dom';
import { biensService } from '../../services/biens';
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
} from '../ui/icons';

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
      setError(err.response?.data?.detail || 'Erreur lors de la création');
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
// COMPOSANT PRINCIPAL : NouveauBien
// ============================================================
const NouveauBien = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    type_bien: '',
    date_acquisition: new Date().toISOString().split('T')[0],
    prix_acquisition: '',
    etat: 'NEUF',
    id_localisation: '',
    date_fin_garantie: '',
    description: '',
    mode_paiement: 'credit',
    fournisseur_id: null,
    marque: '',
    modele: '',
    immatriculation: '',
    fabricant: '',
    puissance: '',
    prix_base: '',
    unites_totales_prevues: '',
    unites_consommees: '',
    duree_fournisseur: '',
    processeur: '',
    ram: '',
    stockage: '',
  });
  const [localisations, setLocalisations] = useState([]);
  const [composants, setComposants] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showLocalisationModal, setShowLocalisationModal] = useState(false);
  const [localisationsLoading, setLocalisationsLoading] = useState(false);

  const steps = useMemo(() => getNouveauBienSteps(t), [t]);
  const ETAT_OPTIONS = useMemo(() => getEtatOptions(t), [t]);
  const TYPE_OPTIONS = useMemo(() => getTypeBienOptions(t), [t]);
  const isMachineProduction = formData.type_bien === 'machine';

  useEffect(() => {
    const loadLocalisations = async () => {
      setLocalisationsLoading(true);
      try {
        const data = await localisationsService.getAll();
        setLocalisations(data.localisations || []);
      } catch (err) {
        console.error('Erreur chargement localisations:', err);
      } finally {
        setLocalisationsLoading(false);
      }
    };
    loadLocalisations();
  }, []);

  useEffect(() => {
    if (!isMachineProduction) return;
    const base = parseFloat(formData.prix_base) || 0;
    const totalComposants = composants.reduce((sum, c) => sum + (parseFloat(c.prix_achat) || 0), 0);
    const total = base + totalComposants;
    setFormData(prev => ({ ...prev, prix_acquisition: total > 0 ? String(total) : '' }));
  }, [formData.prix_base, composants, isMachineProduction]);

  const handleCreateLocalisation = async (data) => {
    try {
      const result = await localisationsService.create(data);
      setLocalisations(prev => [...prev, result]);
      handleChange('id_localisation', String(result.id_localisation));
      return result;
    } catch (err) {
      console.error('Erreur création localisation:', err);
      throw err;
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.type_bien) newErrors.type_bien = 'Le type de bien est requis';
      if (!formData.date_acquisition) newErrors.date_acquisition = "La date d'acquisition est requise";
      if (!formData.id_localisation || formData.id_localisation === '') {
        newErrors.id_localisation = 'La localisation est requise';
      }
      if (!formData.mode_paiement) newErrors.mode_paiement = 'Le mode de paiement est requis';
      if (formData.mode_paiement === 'credit' && !formData.fournisseur_id) {
        newErrors.fournisseur_id = 'Le fournisseur est requis pour un paiement à crédit';
      }
    }

    if (step === 1 && formData.type_bien) {
      if (formData.type_bien === 'vehicule') {
        if (!formData.marque) newErrors.marque = 'La marque est requise';
        if (!formData.immatriculation) newErrors.immatriculation = "L'immatriculation est requise";
      } 
      else if (formData.type_bien === 'machine') {
        if (!formData.fabricant) newErrors.fabricant = 'Le fabricant est requis';
        if (!formData.prix_base || parseFloat(formData.prix_base) < 0) {
          newErrors.prix_base = 'Le prix de base de la machine est requis';
        }
      } 
      else if (formData.type_bien === 'ordinateur') {
        if (!formData.marque) newErrors.marque = 'La marque est requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getErrorMessage = (err) => {
    const detail = err.response?.data?.detail;
    if (Array.isArray(detail)) {
      const firstError = detail[0];
      const field = firstError.loc ? firstError.loc[firstError.loc.length - 1] : '';
      const msg = firstError.msg || '';
      
      const fieldLabels = {
        'prix_base': 'Prix de base',
        'fabricant': 'Fabricant',
        'marque': 'Marque',
        'immatriculation': 'Immatriculation',
        'type_bien': 'Type de bien',
        'date_acquisition': "Date d'acquisition",
        'id_localisation': 'Localisation',
        'mode_paiement': 'Mode de paiement',
        'fournisseur_id': 'Fournisseur',
        'prix_acquisition': "Prix d'acquisition"
      };
      
      const fieldLabel = fieldLabels[field] || field;
      
      if (msg.includes('required') || msg.includes('requis')) {
        return `Le champ "${fieldLabel}" est obligatoire.`;
      }
      if (msg.includes('invalid') || msg.includes('invalide')) {
        return `Le champ "${fieldLabel}" est invalide.`;
      }
      if (msg.includes('greater than') || msg.includes('positive')) {
        return `Le champ "${fieldLabel}" doit être supérieur à 0.`;
      }
      
      return msg || 'Veuillez vérifier les champs du formulaire.';
    }

    if (typeof detail === 'string') {
      if (detail.includes('localisation')) {
        return 'La localisation sélectionnée n\'est pas valide.';
      }
      if (detail.includes('fournisseur')) {
        return 'Le fournisseur sélectionné n\'est pas valide.';
      }
      if (detail.includes('prix')) {
        return 'Le prix saisi n\'est pas valide.';
      }
      if (detail.includes('existe déjà')) {
        return 'Un bien avec ces informations existe déjà.';
      }
      if (detail.includes('colonne') || detail.includes('column') || detail.includes('id_localisation')) {
        return 'Erreur de configuration de la base de données. Veuillez contacter l\'administrateur.';
      }
      return detail;
    }

    return 'Une erreur est survenue lors de la création du bien. Veuillez réessayer.';
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        type_bien: formData.type_bien,
        date_acquisition: formData.date_acquisition,
        etat: formData.etat,
        id_localisation: parseInt(formData.id_localisation, 10),
        date_fin_garantie: formData.date_fin_garantie || null,
        description: formData.description || null,
        mode_paiement: formData.mode_paiement,
        fournisseur_id: formData.fournisseur_id,
      };
      
      if (formData.type_bien === 'machine') {
        payload.prix_base = parseFloat(formData.prix_base) || 0;
        payload.prix_acquisition = parseFloat(formData.prix_acquisition) || 0;
        payload.composants = composants.map((c) => ({
          numero_serie: c.numero_serie,
          prix_achat: parseFloat(c.prix_achat) || 0,
          designation: c.designation || `Composant ${c.numero_serie}`,
        }));
      } else {
        payload.prix_acquisition = parseFloat(formData.prix_acquisition) || 0;
      }
      
      if (formData.type_bien === 'vehicule') {
        payload.marque = formData.marque;
        payload.modele = formData.modele || null;
        payload.immatriculation = formData.immatriculation;
      } else if (formData.type_bien === 'machine') {
        payload.fabricant = formData.fabricant;
        payload.puissance = formData.puissance ? parseFloat(formData.puissance) : null;
        payload.unites_totales_prevues = formData.unites_totales_prevues ? parseInt(formData.unites_totales_prevues, 10) : null;
        payload.unites_consommees = formData.unites_consommees ? parseInt(formData.unites_consommees, 10) : null;
        payload.duree_fournisseur = formData.duree_fournisseur ? parseInt(formData.duree_fournisseur, 10) : null;
      } else if (formData.type_bien === 'ordinateur') {
        payload.marque = formData.marque;
        payload.processeur = formData.processeur || null;
        payload.ram = formData.ram || null;
        payload.stockage = formData.stockage || null;
      }
      
      const result = await biensService.create(payload);
      setShowSuccessDialog(true);
      setTimeout(() => navigate('/biens'), 3000);
      
    } catch (err) {
      console.error('Erreur création bien:', err);
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSpecificFields = () => {
    const type = formData.type_bien;
    if (!type) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-700 dark:text-blue-300 text-center text-sm sm:text-base">
          <span className="inline-flex items-center gap-2"><AppIcon icon={ExclamationTriangleIcon} size="sm" /> Veuillez d'abord sélectionner un type de bien à l'étape 1</span>
        </div>
      );
    }

    if (type === 'vehicule') {
      return (
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-2"><AppIcon icon={TruckIcon} size="md" /> Informations véhicule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Marque <span className="text-danger">*</span></label>
              <input type="text" value={formData.marque} onChange={(e) => handleChange('marque', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.marque ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} placeholder="Ex: Toyota, Renault, Peugeot..." />
              {errors.marque && <span className="text-sm text-danger mt-1">{errors.marque}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Modèle</label>
              <input type="text" value={formData.modele} onChange={(e) => handleChange('modele', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: Hilux, Clio, 308..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Immatriculation <span className="text-danger">*</span></label>
            <input type="text" value={formData.immatriculation} onChange={(e) => handleChange('immatriculation', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.immatriculation ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} placeholder="Ex: AB-123-CD" />
            {errors.immatriculation && <span className="text-sm text-danger mt-1">{errors.immatriculation}</span>}
          </div>
        </div>
      );
    }

    if (type === 'machine') {
      return (
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-2"><AppIcon icon={BuildingOffice2Icon} size="md" /> Machine de production</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fabricant <span className="text-danger">*</span></label>
              <input type="text" value={formData.fabricant} onChange={(e) => handleChange('fabricant', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.fabricant ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} placeholder="Ex: Siemens, Caterpillar, ABB..." />
              {errors.fabricant && <span className="text-sm text-danger mt-1">{errors.fabricant}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Puissance (kW/CV)</label>
              <input type="number" value={formData.puissance} onChange={(e) => handleChange('puissance', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 150" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unités totales prévues</label>
              <input type="number" value={formData.unites_totales_prevues} onChange={(e) => handleChange('unites_totales_prevues', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 100000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unités consommées</label>
              <input type="number" value={formData.unites_consommees} onChange={(e) => handleChange('unites_consommees', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 0" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Durée fournisseur (jours)</label>
              <input type="number" value={formData.duree_fournisseur} onChange={(e) => handleChange('duree_fournisseur', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 7800" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Prix de base machine (USD) <span className="text-danger">*</span></label>
              <input type="number" value={formData.prix_base} onChange={(e) => handleChange('prix_base', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.prix_base ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} placeholder="Prix de base hors composants" />
              {errors.prix_base && <span className="text-sm text-danger mt-1">{errors.prix_base}</span>}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border-light dark:border-border-dark">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <h4 className="font-medium text-gray-900 dark:text-slate-100 text-sm sm:text-base">Composants</h4>
              <button type="button" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors w-full sm:w-auto" onClick={() => setComposants(prev => [...prev, { numero_serie: '', prix_achat: '', designation: '' }])}>
                <AppIcon icon={PlusIcon} size="xs" /> Ajouter
              </button>
            </div>
            {composants.map((comp, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-night-active rounded-lg mb-2 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-0.5">Désignation</label>
                  <input type="text" value={comp.designation} onChange={(e) => { const updated = [...composants]; updated[index] = { ...updated[index], designation: e.target.value }; setComposants(updated); }} className="w-full px-2 sm:px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: Moteur principal" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-0.5">N° de série *</label>
                  <input type="text" value={comp.numero_serie} onChange={(e) => { const updated = [...composants]; updated[index] = { ...updated[index], numero_serie: e.target.value }; setComposants(updated); }} className="w-full px-2 sm:px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: MOT-99823-A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-0.5">Prix d'achat *</label>
                  <input type="number" value={comp.prix_achat} onChange={(e) => { const updated = [...composants]; updated[index] = { ...updated[index], prix_achat: e.target.value }; setComposants(updated); }} className="w-full px-2 sm:px-3 py-1.5 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 1500" />
                </div>
                <div className="flex justify-end sm:justify-end lg:justify-end">
                  <button type="button" onClick={() => setComposants(prev => prev.filter((_, i) => i !== index))} className="px-2.5 py-1.5 bg-red-100 text-danger hover:bg-red-200 rounded-lg transition-colors flex items-center gap-1 text-sm w-full sm:w-auto justify-center">
                    <AppIcon icon={TrashIcon} size="sm" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'ordinateur') {
      return (
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-2"><AppIcon icon={ComputerDesktopIcon} size="md" /> Informations ordinateur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Marque <span className="text-danger">*</span></label>
              <input type="text" value={formData.marque} onChange={(e) => handleChange('marque', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.marque ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} placeholder="Ex: Dell, HP, Lenovo..." />
              {errors.marque && <span className="text-sm text-danger mt-1">{errors.marque}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Processeur</label>
              <input type="text" value={formData.processeur} onChange={(e) => handleChange('processeur', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: Intel i7, AMD Ryzen 5..." />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">RAM</label>
              <input type="text" value={formData.ram} onChange={(e) => handleChange('ram', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 16 Go DDR4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Stockage</label>
              <input type="text" value={formData.stockage} onChange={(e) => handleChange('stockage', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Ex: 512 Go SSD" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-700 dark:text-blue-300 text-center text-sm sm:text-base">
        <span className="inline-flex items-center gap-2"><AppIcon icon={CheckCircleIcon} size="sm" /> Aucune information spécifique requise pour ce type de bien</span>
      </div>
    );
  };

  const renderConfirmation = () => {
    const compteCredit = formData.mode_paiement === 'credit' ? '481' : '512';
    const compteDebit = { vehicule: '2445', machine: '2441', ordinateur: '2443' }[formData.type_bien] || '2440';
    const localisationNom = localisations.find(l => String(l.id_localisation) === String(formData.id_localisation))?.nom_localisation || '—';

    return (
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-2"><AppIcon icon={ClipboardDocumentListIcon} size="md" /> Récapitulatif du bien</h3>
        <div className="bg-gray-50 dark:bg-night-active rounded-xl p-3 sm:p-4 divide-y divide-border-light dark:divide-border-dark">
          <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Type :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base break-words">{TYPE_OPTIONS.find(t => t.value === formData.type_bien)?.label || formData.type_bien}</span></div>
          <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Date acquisition :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{new Date(formData.date_acquisition).toLocaleDateString('fr-FR')}</span></div>
          <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Prix :</span><span className="text-gray-900 dark:text-slate-100 font-semibold text-sm sm:text-base">{parseInt(formData.prix_acquisition || 0).toLocaleString()} USD</span></div>
          <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">État :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{ETAT_OPTIONS.find(e => e.value === formData.etat)?.label}</span></div>
          <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Localisation :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{localisationNom}</span></div>
          <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Mode de paiement :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{formData.mode_paiement === 'credit' ? 'Crédit' : 'Comptant'}</span></div>
          {formData.fournisseur_id && <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Fournisseur :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">ID #{formData.fournisseur_id}</span></div>}
          {formData.marque && <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Marque :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{formData.marque}</span></div>}
          {formData.immatriculation && <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Immatriculation :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{formData.immatriculation}</span></div>}
          {formData.description && <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Désignation :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{formData.description}</span></div>}
          {composants.length > 0 && <div className="flex flex-col sm:flex-row py-2.5"><span className="w-full sm:w-36 font-medium text-gray-600 dark:text-slate-400 text-sm">Composants :</span><span className="text-gray-900 dark:text-slate-100 text-sm sm:text-base">{composants.length} composant(s)</span></div>}
          <div className="pt-4 mt-2 border-t-2 border-primary-200 dark:border-primary-800">
            <div className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">📊 Écriture comptable générée</div>
            <div className="flex flex-col sm:flex-row justify-between py-1 text-sm"><span className="text-gray-600 dark:text-slate-400">Débit :</span><span className="font-medium text-gray-900 dark:text-slate-100">{compteDebit} (Immobilisation)</span></div>
            <div className="flex flex-col sm:flex-row justify-between py-1 text-sm"><span className="text-gray-600 dark:text-slate-400">Crédit :</span><span className="font-medium text-gray-900 dark:text-slate-100">{compteCredit} ({formData.mode_paiement === 'credit' ? 'Fournisseur' : 'Banque'})</span></div>
            <div className="flex flex-col sm:flex-row justify-between py-1 text-sm"><span className="text-gray-600 dark:text-slate-400">Montant :</span><span className="font-medium text-gray-900 dark:text-slate-100">{parseInt(formData.prix_acquisition || 0).toLocaleString()} USD</span></div>
            <div className="flex flex-col sm:flex-row justify-between py-1 text-sm"><span className="text-gray-600 dark:text-slate-400">Statut :</span><span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">BROUILLON (à valider)</span></div>
          </div>
        </div>
      </div>
    );
  };

  const SuccessDialog = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-md w-full mx-auto p-4 sm:p-6">
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AppIcon icon={CheckCircleIcon} size="lg" className="text-success dark:text-green-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{t('assets.bienCreated')}</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">{t('assets.bienCreatedDesc')}</p>
          <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-left">
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">📝 {t('assets.ecritureAcquisitionGenered')}</p>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{t('assets.ecritureAcquisitionDetail')}</p>
          </div>
          <button onClick={() => navigate('/biens')} className="mt-4 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base">
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-night-hover rounded-lg transition-colors" onClick={() => navigate('/biens')}>
          <AppIcon icon={ArrowLeftIcon} size="md" className="text-gray-600 dark:text-slate-400" />
        </button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-slate-100 inline-flex items-center gap-2">
          <AppIcon icon={PlusIcon} size="sm" /> Ajouter un bien
        </h1>
      </div>

      {/* Stepper - Responsive */}
      <div className="flex justify-between mb-4 sm:mb-6 bg-white dark:bg-surface-dark rounded-xl p-3 sm:p-4 shadow-card overflow-x-auto">
        {steps.map((label, index) => (
          <div key={index} className="flex-1 text-center relative min-w-[60px] sm:min-w-[80px]">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto mb-1 font-semibold text-xs sm:text-sm transition-colors ${activeStep === index ? 'bg-primary-600 text-white' : activeStep > index ? 'bg-success text-white' : 'bg-gray-200 dark:bg-night-muted text-gray-500 dark:text-slate-400'}`}>
              {activeStep > index ? <AppIcon icon={CheckCircleIcon} size="xs" /> : index + 1}
            </div>
            <div className={`text-[10px] sm:text-xs font-medium truncate ${activeStep === index ? 'text-primary-600 dark:text-primary-400' : activeStep > index ? 'text-success' : 'text-gray-500 dark:text-slate-400'}`}>{label}</div>
            {index < steps.length - 1 && (
              <div className={`absolute top-3.5 left-[calc(50%+14px)] w-[calc(100%-28px)] h-0.5 hidden sm:block ${activeStep > index ? 'bg-success' : 'bg-gray-200 dark:bg-night-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl p-4 sm:p-6 shadow-card">
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-danger text-danger rounded text-sm">
            <div className="flex items-start gap-2">
              <AppIcon icon={ExclamationTriangleIcon} size="sm" className="mt-0.5 text-danger" />
              <span>{submitError}</span>
            </div>
          </div>
        )}

        {activeStep === 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100">📋 Informations d'acquisition</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type de bien <span className="text-danger">*</span></label>
                <select value={formData.type_bien} onChange={(e) => handleChange('type_bien', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.type_bien ? 'border-danger' : 'border-border-light dark:border-border-dark'}`}>
                  <option value="">Sélectionnez un type</option>
                  {TYPE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
                {errors.type_bien && <span className="text-sm text-danger mt-1">{errors.type_bien}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date d'acquisition <span className="text-danger">*</span></label>
                <input type="date" value={formData.date_acquisition} onChange={(e) => handleChange('date_acquisition', e.target.value)} className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.date_acquisition ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} />
                {errors.date_acquisition && <span className="text-sm text-danger mt-1">{errors.date_acquisition}</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Prix d'acquisition (USD)</label>
                <input type="number" value={formData.prix_acquisition} onChange={(e) => handleChange('prix_acquisition', e.target.value)} placeholder="Ex: 25000000" className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.prix_acquisition ? 'border-danger' : 'border-border-light dark:border-border-dark'} ${isMachineProduction ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`} disabled={isMachineProduction} readOnly={isMachineProduction} />
                {isMachineProduction && <span className="text-xs text-gray-500 dark:text-slate-400">Calculé automatiquement</span>}
                {errors.prix_acquisition && <span className="text-sm text-danger mt-1">{errors.prix_acquisition}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">État <span className="text-danger">*</span></label>
                <select value={formData.etat} onChange={(e) => handleChange('etat', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors">
                  {ETAT_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
              </div>
            </div>

            <ModePaiementSelector mode={formData.mode_paiement} onChange={(mode) => { handleChange('mode_paiement', mode); if (mode === 'comptant') handleChange('fournisseur_id', null); }} errors={errors} />

            {formData.mode_paiement === 'credit' && (
              <FournisseurAutocomplete value={formData.fournisseur_id} onChange={(id) => handleChange('fournisseur_id', id)} errors={errors} />
            )}

            <div className="p-3 bg-gray-50 dark:bg-night-active rounded-lg text-sm">
              <span className="text-gray-600 dark:text-slate-400">💡 Compte crédit utilisé :</span>
              <span className="ml-2 font-semibold text-primary-700 dark:text-primary-300">{formData.mode_paiement === 'credit' ? '481 (Fournisseur)' : '512 (Banque)'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Localisation <span className="text-danger">*</span></label>
                <div className="flex gap-2">
                  <select value={formData.id_localisation} onChange={(e) => handleChange('id_localisation', e.target.value)} className={`flex-1 px-3 py-2 text-sm sm:text-base border rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${errors.id_localisation ? 'border-danger' : 'border-border-light dark:border-border-dark'}`} disabled={localisationsLoading}>
                    <option value="">{localisationsLoading ? 'Chargement...' : 'Sélectionnez une localisation'}</option>
                    {localisations.map((loc) => (<option key={loc.id_localisation} value={String(loc.id_localisation)}>{loc.nom_localisation}</option>))}
                  </select>
                  <button type="button" className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0" onClick={() => setShowLocalisationModal(true)} title="Ajouter une localisation">
                    <AppIcon icon={PlusIcon} size="sm" />
                  </button>
                </div>
                {errors.id_localisation && <span className="text-sm text-danger mt-1">{errors.id_localisation}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date fin de garantie</label>
                <input type="date" value={formData.date_fin_garantie} onChange={(e) => handleChange('date_fin_garantie', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Désignation</label>
              <textarea rows="3" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-3 py-2 text-sm sm:text-base border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors" placeholder="Désignation de l'actif..." />
            </div>
          </div>
        )}

        {activeStep === 1 && renderSpecificFields()}
        {activeStep === 2 && renderConfirmation()}

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-4 border-t border-border-light dark:border-border-dark">
          <button className="px-4 py-2 bg-gray-100 dark:bg-night-muted text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-night-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-2 sm:order-1" onClick={handleBack} disabled={activeStep === 0}>
            ← Retour
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
            {activeStep === 2 ? (
              <button className="px-6 py-2 bg-success hover:bg-success/90 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 w-full sm:w-auto" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Création en cours...' : (<><AppIcon icon={CheckCircleIcon} size="sm" className="text-white" /> Enregistrer</>)}
              </button>
            ) : (
              <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors w-full sm:w-auto" onClick={handleNext}>
                Suivant →
              </button>
            )}
            <button className="px-4 py-2 border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-night-hover rounded-lg transition-colors w-full sm:w-auto" onClick={() => navigate('/biens')}>
              Annuler
            </button>
          </div>
        </div>
      </div>

      <LocalisationModal isOpen={showLocalisationModal} onClose={() => setShowLocalisationModal(false)} onSave={handleCreateLocalisation} existingNames={localisations.map(loc => loc.nom_localisation)} />
      {showSuccessDialog && <SuccessDialog />}
    </div>
  );
};

export default NouveauBien;