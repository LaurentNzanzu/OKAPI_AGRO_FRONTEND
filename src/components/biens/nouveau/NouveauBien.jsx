// frontend/src/components/biens/NouveauBien.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { getEtatOptions, getTypeBienOptions, getNouveauBienSteps } from '../../../utils/i18nBiens';
import { useNavigate } from 'react-router-dom';
import { biensService } from '../../../services/biens';
import { fournisseursService } from '../../../services/fournisseurs';
import { useAuth } from '../../../hooks/useAuth';
import ConfirmDialog from '../../common/ConfirmDialog';
import QRCodeGenerator from '../../common/QRCodeGenerator';
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
} from '../../ui/icons';

// ============================================================
// COMPOSANT DE MODAL POUR CRUD FOURNISSEUR
// ============================================================
const FournisseurModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  fournisseur,
  isEdit = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    numero_contribuable: '',
  });
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
      setFormData({
        nom: '',
        adresse: '',
        telephone: '',
        email: '',
        numero_contribuable: '',
      });
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
      if (result) {
        onClose();
      }
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
      <div className="fournisseur-modal-overlay" onClick={onClose}>
        <div className="fournisseur-modal" onClick={(e) => e.stopPropagation()}>
          <div className="fournisseur-modal-header">
            <h3 className="fournisseur-modal-title">
              {isEdit ? (
                <span className="inline-flex items-center gap-2">
                  <PencilSquareIcon className="w-5 h-5" />
                  {t('assets.editFournisseur')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5" />
                  {t('assets.addFournisseur')}
                </span>
              )}
            </h3>
            <button className="fournisseur-modal-close" onClick={onClose}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="fournisseur-modal-body">
            <div className="form-group">
              <label>Nom du fournisseur </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                className={errors.nom ? 'error' : ''}
                placeholder="Ex: Toyota RDC, Dell Congo..."
              />
              {errors.nom && <span className="error-text">{errors.nom}</span>}
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                placeholder="Ex: 123, Avenue de l'Industrie, Kinshasa"
              />
            </div>

            <div className="form-row-modal">
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="Ex: +243 999 999 999"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'error' : ''}
                  placeholder="Ex: contact@fournisseur.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Numéro de contribuable</label>
              <input
                type="text"
                value={formData.numero_contribuable}
                onChange={(e) => handleChange('numero_contribuable', e.target.value)}
                placeholder="Ex: A123456789"
              />
            </div>

            <div className="fournisseur-modal-actions">
              {isEdit && (
                <button
                  type="button"
                  className="btn-delete-fournisseur"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <TrashIcon className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              )}
              <div className="fournisseur-modal-actions-right">
                <button type="button" className="btn-cancel-modal" onClick={onClose}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-save-fournisseur" disabled={submitting}>
                  {submitting ? t('common.saving') : (isEdit ? t('common.update') : t('common.add'))}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation de suppression */}
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
// COMPOSANT DE SÉLECTION DU MODE DE PAIEMENT
// ============================================================
const ModePaiementSelector = ({ mode, onChange, errors }) => {
  const { t } = useTranslation();
  
  return (
    <div className="mode-paiement-selector">
      <label className="form-label">{t('assets.fieldModePaiement')}</label>
      <div className="mode-paiement-options">
        <button
          type="button"
          className={`mode-option ${mode === 'credit' ? 'active' : ''}`}
          onClick={() => onChange('credit')}
        >
          <span className="mode-icon">
            <AppIcon icon={CreditCardIcon} size="md" />
          </span>
          <span className="mode-label">{t('assets.modeCredit')}</span>
        </button>
        <button
          type="button"
          className={`mode-option ${mode === 'comptant' ? 'active' : ''}`}
          onClick={() => onChange('comptant')}
        >
          <span className="mode-icon">
            <AppIcon icon={BanknotesIcon} size="md" />
          </span>
          <span className="mode-label">{t('assets.modeComptant')}</span>
        </button>
      </div>
      {errors?.mode_paiement && <span className="error-text">{errors.mode_paiement}</span>}
    </div>
  );
};

// ============================================================
// COMPOSANT DE RECHERCHE DE FOURNISSEUR (AUTOCOMPLÉTION AVEC CRUD)
// ============================================================
const FournisseurAutocomplete = ({ 
  value, 
  onChange, 
  onBlur, 
  errors, 
  disabled = false,
  onAddFournisseur,
  onEditFournisseur,
  onDeleteFournisseur,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editFournisseur, setEditFournisseur] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const inputRef = useRef(null);

  // Récupérer le label du fournisseur sélectionné
  useEffect(() => {
    if (value) {
      fournisseursService.getById(value)
        .then(f => {
          setSelectedLabel(f.nom);
          setInputValue(f.nom);
        })
        .catch(() => {
          setSelectedLabel('');
          setInputValue('');
        });
    } else {
      setSelectedLabel('');
      setInputValue('');
    }
  }, [value]);

  // Recherche de fournisseurs
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

  // Debounce sur la recherche
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
    setSelectedLabel(fournisseur.nom);
    setInputValue(fournisseur.nom);
    onChange(fournisseur.id);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    if (val === '') {
      onChange(null);
      setSelectedLabel('');
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (inputValue.length >= 1) {
      searchFournisseurs(inputValue);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
    if (onBlur) onBlur();
  };

  // ============================================================
  // GESTION DU CRUD FOURNISSEUR
  // ============================================================
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
      // Mettre à jour la suggestion
      setSuggestions(prev => 
        prev.map(f => f.id === result.id ? result : f)
      );
      // Si c'est le fournisseur sélectionné, mettre à jour
      if (value === result.id) {
        setSelectedLabel(result.nom);
        setInputValue(result.nom);
      }
    } else {
      result = await fournisseursService.create(data);
      // Ajouter à la liste des suggestions
      setSuggestions(prev => [result, ...prev]);
    }
    // Appeler le callback parent si fourni
    if (onAddFournisseur) onAddFournisseur(result);
    return result;
  };

  const handleDeleteFournisseur = async (id) => {
    await fournisseursService.delete(id);
    // Retirer de la liste des suggestions
    setSuggestions(prev => prev.filter(f => f.id !== id));
    // Si c'était le fournisseur sélectionné, le désélectionner
    if (value === id) {
      onChange(null);
      setSelectedLabel('');
      setInputValue('');
    }
  };

  return (
    <>
      <div className="fournisseur-autocomplete">
        <label className="form-label">
          {t('assets.fieldFournisseur')} <span className="required">*</span>
        </label>
        <div className="autocomplete-wrapper">
          <div className="autocomplete-input-wrapper">
            <span className="autocomplete-icon">
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
              className={errors?.fournisseur_id ? 'error' : ''}
              disabled={disabled}
              autoComplete="off"
            />
            <button
              type="button"
              className="autocomplete-add-btn"
              onClick={handleAddNew}
              title={t('assets.addFournisseur')}
            >
              <UserPlusIcon className="w-4 h-4" />
            </button>
          </div>
          
          {isOpen && (suggestions.length > 0 || loading) && (
            <div className="autocomplete-dropdown">
              {loading && (
                <div className="autocomplete-loading">{t('common.loading')}</div>
              )}
              {!loading && suggestions.length === 0 && inputValue.length >= 1 && (
                <div className="autocomplete-empty">
                  <span>{t('assets.noFournisseurFound')}</span>
                  <button 
                    className="autocomplete-empty-add"
                    onClick={handleAddNew}
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    {t('assets.addFournisseur')}
                  </button>
                </div>
              )}
              {!loading && suggestions.map((f) => (
                <div
                  key={f.id}
                  className={`autocomplete-item ${value === f.id ? 'selected' : ''}`}
                  onMouseDown={() => handleSelect(f)}
                >
                  <div className="autocomplete-item-content">
                    <div className="autocomplete-item-name">{f.nom}</div>
                    {f.telephone && (
                      <div className="autocomplete-item-detail">{f.telephone}</div>
                    )}
                    {f.email && (
                      <div className="autocomplete-item-detail">{f.email}</div>
                    )}
                  </div>
                  <div className="autocomplete-item-actions">
                    <button
                      type="button"
                      className="autocomplete-item-edit"
                      onClick={(e) => handleEdit(f, e)}
                      title={t('common.edit')}
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors?.fournisseur_id && <span className="error-text">{errors.fournisseur_id}</span>}
        {value && (
          <div className="fournisseur-info-badge">
            <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
              <CheckCircleIcon className="w-3 h-3" />
              {t('assets.fournisseurSelected')}
            </span>
          </div>
        )}
      </div>

      {/* Modal CRUD Fournisseur */}
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
// COMPOSANT PRINCIPAL - NOUVEAU BIEN
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
    localisation: '',
    description: '',
    // NOUVEAUX CHAMPS
    mode_paiement: 'credit',
    fournisseur_id: null,
    // Attributs véhicule
    marque: '',
    modele: '',
    immatriculation: '',
    // Attributs machine
    fabricant: '',
    numero_serie: '',
    puissance: '',
    // Attributs ordinateur
    processeur: '',
    ram: '',
    stockage: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdBien, setCreatedBien] = useState(null);

  const steps = useMemo(() => getNouveauBienSteps(t), [t]);
  const ETAT_OPTIONS = useMemo(() => getEtatOptions(t), [t]);
  const TYPE_OPTIONS = useMemo(() => getTypeBienOptions(t), [t]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.type_bien) newErrors.type_bien = 'Le type de bien est requis';
      if (!formData.date_acquisition) newErrors.date_acquisition = "La date d'acquisition est requise";
      if (!formData.prix_acquisition || parseFloat(formData.prix_acquisition) <= 0) {
        newErrors.prix_acquisition = 'Un prix valide est requis';
      }
      if (!formData.localisation) newErrors.localisation = 'La localisation est requise';
      
      // Validation du mode de paiement et fournisseur
      if (!formData.mode_paiement) {
        newErrors.mode_paiement = 'Le mode de paiement est requis';
      }
      if (formData.mode_paiement === 'credit' && !formData.fournisseur_id) {
        newErrors.fournisseur_id = 'Le fournisseur est requis pour un paiement à crédit';
      }
    }
    
    if (step === 1 && formData.type_bien) {
      if (formData.type_bien === 'vehicule') {
        if (!formData.marque) newErrors.marque = 'La marque est requise';
        if (!formData.immatriculation) newErrors.immatriculation = "L'immatriculation est requise";
      } else if (formData.type_bien === 'machine') {
        if (!formData.fabricant) newErrors.fabricant = 'Le fabricant est requis';
        if (!formData.numero_serie) newErrors.numero_serie = 'Le numéro de série est requis';
      } else if (formData.type_bien === 'ordinateur') {
        if (!formData.marque) newErrors.marque = 'La marque est requise';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // ============================================================
  // SOUMISSION AVEC GÉNÉRATION D'ÉCRITURE
  // ============================================================
  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload = {
        type_bien: formData.type_bien,
        date_acquisition: formData.date_acquisition,
        prix_acquisition: parseFloat(formData.prix_acquisition),
        etat: formData.etat,
        localisation: formData.localisation,
        description: formData.description,
        // NOUVEAUX CHAMPS
        mode_paiement: formData.mode_paiement,
        fournisseur_id: formData.fournisseur_id,
        devise: 'USD', // Devise par défaut
      };
      
      // Ajout des champs spécifiques selon le type
      if (formData.type_bien === 'vehicule') {
        payload.marque = formData.marque;
        payload.modele = formData.modele;
        payload.immatriculation = formData.immatriculation;
      } else if (formData.type_bien === 'machine') {
        payload.fabricant = formData.fabricant;
        payload.numero_serie = formData.numero_serie;
        payload.puissance = formData.puissance;
      } else if (formData.type_bien === 'ordinateur') {
        payload.marque = formData.marque;
        payload.processeur = formData.processeur;
        payload.ram = formData.ram;
        payload.stockage = formData.stockage;
      }
      
      const result = await biensService.create(payload);
      setCreatedBien(result);
      setShowSuccessDialog(true);
      
      // Navigation après un court délai
      setTimeout(() => {
        navigate('/biens');
      }, 3000);
    } catch (err) {
      console.error('Erreur création bien:', err);
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la création du bien';
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDU DES CHAMPS SPÉCIFIQUES
  // ============================================================
  const renderSpecificFields = () => {
    const type = formData.type_bien;
    
    if (!type) {
      return (
        <div className="info-message">
          <span className="inline-flex items-center gap-2">
            <AppIcon icon={ExclamationTriangleIcon} size="sm" />
            Veuillez d'abord sélectionner un type de bien à l'étape 1
          </span>
        </div>
      );
    }
    
    if (type === 'vehicule') {
      return (
        <div className="specific-fields">
          <h3 className="inline-flex items-center gap-2"><AppIcon icon={TruckIcon} size="sm" /> Informations véhicule</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Marque *</label>
              <input
                type="text"
                value={formData.marque}
                onChange={(e) => handleChange('marque', e.target.value)}
                className={errors.marque ? 'error' : ''}
                placeholder="Ex: Toyota, Renault, Peugeot..."
              />
              {errors.marque && <span className="error-text">{errors.marque}</span>}
            </div>
            <div className="form-group">
              <label>Modèle</label>
              <input
                type="text"
                value={formData.modele}
                onChange={(e) => handleChange('modele', e.target.value)}
                placeholder="Ex: Hilux, Clio, 308..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Immatriculation *</label>
              <input
                type="text"
                value={formData.immatriculation}
                onChange={(e) => handleChange('immatriculation', e.target.value)}
                className={errors.immatriculation ? 'error' : ''}
                placeholder="Ex: AB-123-CD"
              />
              {errors.immatriculation && <span className="error-text">{errors.immatriculation}</span>}
            </div>
          </div>
        </div>
      );
    }
    
    if (type === 'machine') {
      return (
        <div className="specific-fields">
          <h3 className="inline-flex items-center gap-2"><AppIcon icon={BuildingOffice2Icon} size="sm" /> Informations machine</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Fabricant *</label>
              <input
                type="text"
                value={formData.fabricant}
                onChange={(e) => handleChange('fabricant', e.target.value)}
                className={errors.fabricant ? 'error' : ''}
                placeholder="Ex: Siemens, Caterpillar, ABB..."
              />
              {errors.fabricant && <span className="error-text">{errors.fabricant}</span>}
            </div>
            <div className="form-group">
              <label>Numéro de série *</label>
              <input
                type="text"
                value={formData.numero_serie}
                onChange={(e) => handleChange('numero_serie', e.target.value)}
                className={errors.numero_serie ? 'error' : ''}
                placeholder="Numéro unique d'identification"
              />
              {errors.numero_serie && <span className="error-text">{errors.numero_serie}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Puissance (kW/CV)</label>
              <input
                type="number"
                value={formData.puissance}
                onChange={(e) => handleChange('puissance', e.target.value)}
                placeholder="Ex: 150 kW"
              />
            </div>
          </div>
        </div>
      );
    }
    
    if (type === 'ordinateur') {
      return (
        <div className="specific-fields">
          <h3 className="inline-flex items-center gap-2"><AppIcon icon={ComputerDesktopIcon} size="sm" /> Informations ordinateur</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Marque *</label>
              <input
                type="text"
                value={formData.marque}
                onChange={(e) => handleChange('marque', e.target.value)}
                className={errors.marque ? 'error' : ''}
                placeholder="Ex: Dell, HP, Lenovo..."
              />
              {errors.marque && <span className="error-text">{errors.marque}</span>}
            </div>
            <div className="form-group">
              <label>Processeur</label>
              <input
                type="text"
                value={formData.processeur}
                onChange={(e) => handleChange('processeur', e.target.value)}
                placeholder="Ex: Intel i7, AMD Ryzen 5..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>RAM</label>
              <input
                type="text"
                value={formData.ram}
                onChange={(e) => handleChange('ram', e.target.value)}
                placeholder="Ex: 16 Go DDR4"
              />
            </div>
            <div className="form-group">
              <label>Stockage</label>
              <input
                type="text"
                value={formData.stockage}
                onChange={(e) => handleChange('stockage', e.target.value)}
                placeholder="Ex: 512 Go SSD"
              />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="info-message">
        <span className="inline-flex items-center gap-2">
          <AppIcon icon={CheckCircleIcon} size="sm" />
          Aucune information spécifique requise pour ce type de bien
        </span>
      </div>
    );
  };

  // ============================================================
  // RENDU DE LA CONFIRMATION
  // ============================================================
  const renderConfirmation = () => {
    const compteCredit = formData.mode_paiement === 'credit' ? '481' : '512';
    const compteDebit = {
      vehicule: '2445',
      machine: '2441',
      ordinateur: '2443',
    }[formData.type_bien] || '2440';
    
    return (
      <div className="confirmation-section">
        <h3 className="inline-flex items-center gap-2"><AppIcon icon={ClipboardDocumentListIcon} size="sm" /> Récapitulatif du bien</h3>
        <div className="recap-card">
          <div className="recap-row">
            <span className="recap-label">Type :</span>
            <span className="recap-value">
              {TYPE_OPTIONS.find(t => t.value === formData.type_bien)?.label || formData.type_bien}
            </span>
          </div>
          <div className="recap-row">
            <span className="recap-label">Date acquisition :</span>
            <span className="recap-value">{new Date(formData.date_acquisition).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="recap-row">
            <span className="recap-label">Prix :</span>
            <span className="recap-value">{parseInt(formData.prix_acquisition).toLocaleString()} USD</span>
          </div>
          <div className="recap-row">
            <span className="recap-label">État :</span>
            <span className="recap-value">{ETAT_OPTIONS.find(e => e.value === formData.etat)?.label}</span>
          </div>
          <div className="recap-row">
            <span className="recap-label">Localisation :</span>
            <span className="recap-value">{formData.localisation}</span>
          </div>
          <div className="recap-row">
            <span className="recap-label">Mode de paiement :</span>
            <span className="recap-value">
              {formData.mode_paiement === 'credit' ? 'Crédit' : 'Comptant'}
            </span>
          </div>
          {formData.fournisseur_id && (
            <div className="recap-row">
              <span className="recap-label">Fournisseur :</span>
              <span className="recap-value">ID #{formData.fournisseur_id}</span>
            </div>
          )}
          {formData.marque && (
            <div className="recap-row">
              <span className="recap-label">Marque :</span>
              <span className="recap-value">{formData.marque}</span>
            </div>
          )}
          {formData.immatriculation && (
            <div className="recap-row">
              <span className="recap-label">Immatriculation :</span>
              <span className="recap-value">{formData.immatriculation}</span>
            </div>
          )}
          {formData.numero_serie && (
            <div className="recap-row">
              <span className="recap-label">N° Série :</span>
              <span className="recap-value">{formData.numero_serie}</span>
            </div>
          )}
          {formData.description && (
            <div className="recap-row">
              <span className="recap-label">Description :</span>
              <span className="recap-value">{formData.description}</span>
            </div>
          )}
          
          {/* Bloc Écriture comptable */}
          <div className="recap-ecriture">
            <div className="recap-ecriture-title">📊 Écriture comptable générée</div>
            <div className="recap-ecriture-detail">
              <span className="recap-ecriture-label">Débit :</span>
              <span className="recap-ecriture-value">{compteDebit} (Immobilisation)</span>
            </div>
            <div className="recap-ecriture-detail">
              <span className="recap-ecriture-label">Crédit :</span>
              <span className="recap-ecriture-value">{compteCredit} ({formData.mode_paiement === 'credit' ? 'Fournisseur' : 'Banque'})</span>
            </div>
            <div className="recap-ecriture-detail">
              <span className="recap-ecriture-label">Montant :</span>
              <span className="recap-ecriture-value">{parseInt(formData.prix_acquisition).toLocaleString()} USD</span>
            </div>
            <div className="recap-ecriture-detail">
              <span className="recap-ecriture-label">Statut :</span>
              <span className="recap-ecriture-value status-brouillon">BROUILLON (à valider)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // SUCCESS DIALOG
  // ============================================================
  const SuccessDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('assets.bienCreated')}
          </h3>
          <p className="text-gray-600 dark:text-slate-400 text-sm">
            {t('assets.bienCreatedDesc')}
          </p>
          <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-left">
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              📝 {t('assets.ecritureAcquisitionGenered')}
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
              {t('assets.ecritureAcquisitionDetail')}
            </p>
          </div>
          <button
            onClick={() => navigate('/biens')}
            className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="nouveau-bien-container">
      <style>{`
        /* === STYLES EXISTANTS (garder ceux du fichier original) === */
        .nouveau-bien-container {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .btn-back {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .btn-back:hover {
          background: #f0f0f0;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          color: #1a1a2e;
        }
        .stepper {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .step {
          flex: 1;
          text-align: center;
          position: relative;
        }
        .step-number {
          width: 32px;
          height: 32px;
          background: #e0e0e0;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
        }
        .step.active .step-number {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .step.completed .step-number {
          background: #4caf50;
          color: white;
        }
        .step-label {
          font-size: 14px;
          color: #666;
        }
        .step.active .step-label {
          color: #667eea;
          font-weight: 500;
        }
        .step:not(:last-child):after {
          content: '';
          position: absolute;
          top: 16px;
          right: -50%;
          width: 100%;
          height: 2px;
          background: #e0e0e0;
        }
        .step.completed:not(:last-child):after {
          background: #4caf50;
        }
        .form-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-weight: 500;
          color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .form-group input.error {
          border-color: #f44336;
        }
        .error-text {
          font-size: 12px;
          color: #f44336;
        }
        .info-message {
          background: #e3f2fd;
          padding: 16px;
          border-radius: 8px;
          color: #1976d2;
          text-align: center;
        }
        .specific-fields h3 {
          margin: 0 0 20px 0;
          color: #1a1a2e;
        }
        .confirmation-section h3 {
          margin: 0 0 20px 0;
          color: #1a1a2e;
        }
        .recap-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
        }
        .recap-row {
          display: flex;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .recap-row:last-child {
          border-bottom: none;
        }
        .recap-label {
          width: 150px;
          font-weight: 500;
          color: #666;
        }
        .recap-value {
          flex: 1;
          color: #333;
        }
        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
        }
        .btn-back-step {
          padding: 10px 24px;
          background: #f0f0f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-back-step:hover {
          background: #e0e0e0;
        }
        .btn-next {
          padding: 10px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-next:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-submit {
          padding: 10px 32px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-submit:hover:not(:disabled) {
          background: #45a049;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-cancel {
          padding: 10px 24px;
          background: none;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          margin-left: 12px;
        }
        .btn-cancel:hover {
          background: #f5f5f5;
        }
        .error-alert {
          background: #ffebee;
          color: #c62828;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #c62828;
        }

        /* === NOUVEAUX STYLES POUR LE CRUD FOURNISSEUR === */
        /* Mode Paiement */
        .mode-paiement-selector {
          margin-bottom: 16px;
        }
        .mode-paiement-options {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }
        .mode-option {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dark .mode-option {
          background: #1f2937;
          border-color: #334155;
        }
        .mode-option:hover {
          border-color: #94a3b8;
        }
        .mode-option.active {
          border-color: #0f2a44;
          background: #f0f4f8;
        }
        .dark .mode-option.active {
          border-color: #3b4f6b;
          background: #24324a;
        }
        .mode-option .mode-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mode-option .mode-label {
          font-weight: 500;
          font-size: 14px;
          color: #1a1a2e;
        }
        .dark .mode-option .mode-label {
          color: #e2e8f0;
        }
        .mode-option.active .mode-label {
          color: #0f2a44;
        }
        .dark .mode-option.active .mode-label {
          color: #e2e8f0;
        }

        /* Autocomplete Fournisseur avec CRUD */
        .fournisseur-autocomplete {
          position: relative;
          margin-bottom: 16px;
        }
        .autocomplete-wrapper {
          position: relative;
        }
        .autocomplete-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .autocomplete-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
        }
        .autocomplete-input-wrapper input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
        }
        .dark .autocomplete-input-wrapper input {
          background: #1f2937;
          border-color: #334155;
          color: #f1f5f9;
        }
        .autocomplete-input-wrapper input:focus {
          outline: none;
          border-color: #0f2a44;
          box-shadow: 0 0 0 3px rgba(15, 42, 68, 0.1);
        }
        .dark .autocomplete-input-wrapper input:focus {
          border-color: #3b4f6b;
          box-shadow: 0 0 0 3px rgba(59, 79, 107, 0.25);
        }
        .autocomplete-input-wrapper input.error {
          border-color: #dc2626;
        }
        .autocomplete-add-btn {
          position: absolute;
          right: 8px;
          padding: 6px 10px;
          background: #0f2a44;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .autocomplete-add-btn:hover {
          background: #1e2a3d;
        }
        .dark .autocomplete-add-btn {
          background: #3b4f6b;
        }
        .dark .autocomplete-add-btn:hover {
          background: #4a5f7b;
        }

        .autocomplete-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-top: 4px;
          max-height: 220px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .dark .autocomplete-dropdown {
          background: #1f2937;
          border-color: #334155;
        }
        .autocomplete-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid #f1f5f9;
        }
        .dark .autocomplete-item {
          border-bottom-color: #273449;
        }
        .autocomplete-item:hover {
          background: #f1f5f9;
        }
        .dark .autocomplete-item:hover {
          background: #273449;
        }
        .autocomplete-item.selected {
          background: #e8f0fe;
        }
        .dark .autocomplete-item.selected {
          background: #1a2538;
        }
        .autocomplete-item:last-child {
          border-bottom: none;
        }
        .autocomplete-item-content {
          flex: 1;
        }
        .autocomplete-item-name {
          font-weight: 500;
          font-size: 14px;
          color: #1a1a2e;
        }
        .dark .autocomplete-item-name {
          color: #e2e8f0;
        }
        .autocomplete-item-detail {
          font-size: 12px;
          color: #94a3b8;
        }
        .autocomplete-item-actions {
          display: flex;
          gap: 4px;
        }
        .autocomplete-item-edit {
          padding: 4px 6px;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .autocomplete-item-edit:hover {
          background: #e2e8f0;
          color: #0f2a44;
        }
        .dark .autocomplete-item-edit:hover {
          background: #334155;
          color: #e2e8f0;
        }

        .autocomplete-loading {
          padding: 12px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }
        .autocomplete-empty {
          padding: 16px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .autocomplete-empty-add {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: #0f2a44;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }
        .autocomplete-empty-add:hover {
          background: #1e2a3d;
        }

        .fournisseur-info-badge {
          margin-top: 6px;
        }

        /* Modal Fournisseur */
        .fournisseur-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .fournisseur-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .dark .fournisseur-modal {
          background: #1f2937;
        }
        .fournisseur-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .dark .fournisseur-modal-header {
          border-bottom-color: #334155;
        }
        .fournisseur-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0;
        }
        .dark .fournisseur-modal-title {
          color: #f1f5f9;
        }
        .fournisseur-modal-close {
          padding: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          transition: background 0.2s;
        }
        .fournisseur-modal-close:hover {
          background: #f1f5f9;
        }
        .dark .fournisseur-modal-close:hover {
          background: #273449;
        }
        .fournisseur-modal-body {
          padding: 24px;
        }
        .form-row-modal {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .fournisseur-modal-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .dark .fournisseur-modal-actions {
          border-top-color: #334155;
        }
        .fournisseur-modal-actions-right {
          display: flex;
          gap: 12px;
        }
        .btn-delete-fournisseur {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .btn-delete-fournisseur:hover {
          background: #fecaca;
        }
        .btn-cancel-modal {
          padding: 8px 20px;
          background: #f1f5f9;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #475569;
          transition: background 0.2s;
        }
        .btn-cancel-modal:hover {
          background: #e2e8f0;
        }
        .dark .btn-cancel-modal {
          background: #334155;
          color: #e2e8f0;
        }
        .dark .btn-cancel-modal:hover {
          background: #475569;
        }
        .btn-save-fournisseur {
          padding: 8px 24px;
          background: #0f2a44;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .btn-save-fournisseur:hover:not(:disabled) {
          background: #1e2a3d;
        }
        .btn-save-fournisseur:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Acquisition section */
        .acquisition-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 16px;
        }
        .dark .acquisition-title {
          color: #f1f5f9;
        }
        .compte-indicator {
          padding: 10px 14px;
          background: #f0f4f8;
          border-radius: 8px;
          margin: 12px 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .dark .compte-indicator {
          background: #1a2538;
        }
        .compte-indicator-label {
          font-size: 13px;
          color: #475569;
        }
        .dark .compte-indicator-label {
          color: #94a3b8;
        }
        .compte-indicator-value {
          font-weight: 600;
          font-size: 13px;
          color: #0f2a44;
        }
        .dark .compte-indicator-value {
          color: #93c5fd;
        }

        /* Recap Ecriture */
        .recap-ecriture {
          margin-top: 16px;
          padding: 14px 16px;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 4px solid #0f2a44;
        }
        .dark .recap-ecriture {
          background: #1a2538;
          border-left-color: #3b4f6b;
        }
        .recap-ecriture-title {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .dark .recap-ecriture-title {
          color: #e2e8f0;
        }
        .recap-ecriture-detail {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
        }
        .recap-ecriture-label {
          color: #64748b;
        }
        .dark .recap-ecriture-label {
          color: #94a3b8;
        }
        .recap-ecriture-value {
          font-weight: 500;
          color: #1a1a2e;
        }
        .dark .recap-ecriture-value {
          color: #e2e8f0;
        }
        .status-brouillon {
          color: #b45309;
          background: #fffbeb;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 12px;
        }
        .dark .status-brouillon {
          color: #fbbf24;
          background: #1e293b;
        }

        .required {
          color: #dc2626;
        }
        .dark .required {
          color: #f87171;
        }

        /* Dark mode overrides */
        .dark .nouveau-bien-container h1 {
          color: #f1f5f9;
        }
        .dark .btn-back:hover {
          background: #273449;
        }
        .dark .stepper {
          background: #1f2937;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .dark .step-number {
          background: #334155;
          color: #94a3b8;
        }
        .dark .step-label {
          color: #94a3b8;
        }
        .dark .step:not(:last-child):after {
          background: #334155;
        }
        .dark .form-card {
          background: #1f2937;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .dark .form-group label {
          color: #cbd5e1;
        }
        .dark .form-group input,
        .dark .form-group select,
        .dark .form-group textarea {
          background: #1f2937;
          border-color: #334155;
          color: #f1f5f9;
        }
        .dark .form-group input:focus,
        .dark .form-group select:focus,
        .dark .form-group textarea:focus {
          border-color: #475569;
          box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.35);
        }
        .dark .info-message {
          background: rgba(30, 58, 138, 0.25);
          color: #93c5fd;
        }
        .dark .specific-fields h3,
        .dark .confirmation-section h3 {
          color: #f1f5f9;
        }
        .dark .recap-card {
          background: #24324a;
        }
        .dark .recap-row {
          border-bottom-color: #334155;
        }
        .dark .recap-label {
          color: #94a3b8;
        }
        .dark .recap-value {
          color: #e2e8f0;
        }
        .dark .btn-back-step {
          background: #334155;
          color: #e2e8f0;
        }
        .dark .btn-back-step:hover {
          background: #475569;
        }
        .dark .btn-cancel {
          border-color: #475569;
          color: #cbd5e1;
        }
        .dark .btn-cancel:hover {
          background: #273449;
        }
        .dark .error-alert {
          background: rgba(127, 29, 29, 0.25);
          color: #fca5a5;
          border-left-color: #dc2626;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .form-row-modal {
            grid-template-columns: 1fr;
          }
          .step:not(:last-child):after {
            display: none;
          }
          .recap-row {
            flex-direction: column;
            gap: 4px;
          }
          .recap-label {
            width: auto;
          }
          .fournisseur-modal-actions {
            flex-direction: column;
            gap: 12px;
          }
          .fournisseur-modal-actions-right {
            width: 100%;
          }
          .fournisseur-modal-actions-right button {
            flex: 1;
          }
          .btn-delete-fournisseur {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="header">
        <button className="btn-back" onClick={() => navigate('/biens')}>←</button>
        <h1 className="inline-flex items-center gap-2"><AppIcon icon={PlusIcon} size="md" /> Ajouter un bien</h1>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {steps.map((label, index) => (
          <div 
            key={index} 
            className={`step ${activeStep === index ? 'active' : ''} ${activeStep > index ? 'completed' : ''}`}
          >
            <div className="step-number">
              {activeStep > index ? <AppIcon icon={CheckCircleIcon} size="sm" /> : index + 1}
            </div>
            <div className="step-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="form-card">
        {submitError && <div className="error-alert">{submitError}</div>}

        {activeStep === 0 && (
          <>
            {/* === NOUVEAU BLOC : INFORMATIONS D'ACQUISITION === */}
            <div className="acquisition-section">
              <h3 className="acquisition-title">📋 Informations d'acquisition</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type de bien </label>
                  <select
                    value={formData.type_bien}
                    onChange={(e) => handleChange('type_bien', e.target.value)}
                    className={errors.type_bien ? 'error' : ''}
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.type_bien && <span className="error-text">{errors.type_bien}</span>}
                </div>
                <div className="form-group">
                  <label>Date d'acquisition </label>
                  <input
                    type="date"
                    value={formData.date_acquisition}
                    onChange={(e) => handleChange('date_acquisition', e.target.value)}
                    className={errors.date_acquisition ? 'error' : ''}
                  />
                  {errors.date_acquisition && <span className="error-text">{errors.date_acquisition}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prix d'acquisition (USD) </label>
                  <input
                    type="number"
                    value={formData.prix_acquisition}
                    onChange={(e) => handleChange('prix_acquisition', e.target.value)}
                    placeholder="Ex: 25 000 000"
                    className={errors.prix_acquisition ? 'error' : ''}
                  />
                  {errors.prix_acquisition && <span className="error-text">{errors.prix_acquisition}</span>}
                </div>
                <div className="form-group">
                  <label>État </label>
                  <select
                    value={formData.etat}
                    onChange={(e) => handleChange('etat', e.target.value)}
                  >
                    {ETAT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* === MODE DE PAIEMENT === */}
              <ModePaiementSelector
                mode={formData.mode_paiement}
                onChange={(mode) => {
                  handleChange('mode_paiement', mode);
                  if (mode === 'comptant') {
                    handleChange('fournisseur_id', null);
                  }
                }}
                errors={errors}
              />

              {/* === FOURNISSEUR AVEC CRUD (conditionnel) === */}
              {formData.mode_paiement === 'credit' && (
                <FournisseurAutocomplete
                  value={formData.fournisseur_id}
                  onChange={(id) => handleChange('fournisseur_id', id)}
                  errors={errors}
                />
              )}

              {/* === INDICATEUR COMPTABLE === */}
              <div className="compte-indicator">
                <span className="compte-indicator-label">💡 Compte crédit utilisé :</span>
                <span className="compte-indicator-value">
                  {formData.mode_paiement === 'credit' ? '481 (Fournisseur)' : '512 (Banque)'}
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Localisation *</label>
                  <input
                    type="text"
                    value={formData.localisation}
                    onChange={(e) => handleChange('localisation', e.target.value)}
                    placeholder="Ex: Bâtiment A, Bureau 12"
                    className={errors.localisation ? 'error' : ''}
                  />
                  {errors.localisation && <span className="error-text">{errors.localisation}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Description détaillée du bien..."
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeStep === 1 && renderSpecificFields()}

        {activeStep === 2 && renderConfirmation()}

        <div className="form-actions">
          <button 
            className="btn-back-step"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            ← Retour
          </button>
          <div>
            {activeStep === 2 ? (
              <button 
                className="btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Création en cours...' : (
                  <span className="inline-flex items-center gap-2">
                    <AppIcon icon={CheckCircleIcon} size="sm" className="text-white" />
                    Enregistrer le bien
                  </span>
                )}
              </button>
            ) : (
              <button className="btn-next" onClick={handleNext}>
                Suivant →
              </button>
            )}
            <button className="btn-cancel" onClick={() => navigate('/biens')}>
              Annuler
            </button>
          </div>
        </div>
      </div>

      {/* Dialog de succès */}
      {showSuccessDialog && <SuccessDialog />}
    </div>
  );
};

export default NouveauBien;