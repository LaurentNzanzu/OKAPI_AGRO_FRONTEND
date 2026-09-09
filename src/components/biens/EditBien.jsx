// frontend/src/components/biens/EditBien.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, Button,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Alert, FormHelperText, CircularProgress, Divider, IconButton,
  Tooltip
} from '@mui/material';
import { ArrowBack, Save, Cancel, Warning, Close } from '@mui/icons-material';
import { biensService } from '../../services/biens';
import usePermissions from '../../hooks/usePermissions';
import { localisationsService } from '../../services/localisations';
import {
  normalizeStatusForSelect,
  normalizeStatusForAPI,
  getEtatSelectOptions,
} from '../../utils/statusNormalizer';
import ImageUpload from '../common/ImageUpload';
import axios from 'axios';

// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const EditBien = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading, canEditBien, isTechnicianMode } = usePermissions();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [localisations, setLocalisations] = useState([]);
  const [localisationsLoading, setLocalisationsLoading] = useState(false);
  const [typeLibelle, setTypeLibelle] = useState('');

  // États pour les images
  const [existingImages, setExistingImages] = useState([]);     // images actuelles du bien
  const [imageFiles, setImageFiles] = useState([]);             // nouveaux fichiers sélectionnés

  const steps = ['Informations générales', 'Caractéristiques spécifiques', 'Confirmation'];

  // Chargement des localisations
  useEffect(() => {
    const loadLocalisations = async () => {
      try {
        setLocalisationsLoading(true);
        const result = await localisationsService.getAll();
        setLocalisations(Array.isArray(result) ? result : result?.localisations || []);
      } catch (err) {
        console.error('Erreur chargement localisations:', err);
      } finally {
        setLocalisationsLoading(false);
      }
    };
    loadLocalisations();
  }, []);

  // Chargement des données existantes
  useEffect(() => {
    if (authLoading) return;

    if (!canEditBien) {
      navigate('/unauthorized');
      return;
    }

    fetchBien();
  }, [id, canEditBien, authLoading, navigate]);

  // Détection des modifications (incluant les images)
  useEffect(() => {
    if (originalData && formData) {
      const commonFields = isTechnicianMode
        ? ['etat', 'id_localisation', 'description']
        : ['date_acquisition', 'prix_acquisition', 'etat', 'id_localisation', 'description'];

      let hasCommonChanges = commonFields.some(key => formData[key] !== originalData[key]);

      // Comparer les attributs spécifiques
      const attrsChanges = Object.keys(formData.attributs_specifiques || {}).some(
        key => formData.attributs_specifiques[key] !== originalData.attributs_specifiques?.[key]
      );

      // Vérifier si les images ont changé
      const originalImages = originalData.images || [];
      const currentImages = existingImages;
      const hasImageChanges =
        currentImages.length !== originalImages.length ||
        currentImages.some((img, idx) => img.url !== originalImages[idx]?.url) ||
        imageFiles.length > 0;

      setHasChanges(hasCommonChanges || attrsChanges || hasImageChanges);
    }
  }, [formData, originalData, existingImages, imageFiles, isTechnicianMode]);

  // ============================================================
  // FETCH BIEN
  // ============================================================
  const fetchBien = async () => {
    try {
      setLoading(true);
      const data = await biensService.getById(id);

      const typeName = data.type_bien_info?.libelle || data.libelle || 'Bien';
      setTypeLibelle(typeName);

      // Initialiser les images
      setExistingImages(data.images || []);

      const attrs = (data.attributs_specifiques && typeof data.attributs_specifiques === 'object')
        ? data.attributs_specifiques
        : {};

      const rawLocId = data.id_localisation
        ?? (typeof data.localisation === 'object' && data.localisation !== null
          ? data.localisation.id_localisation
          : data.localisation)
        ?? '';
      const locId = rawLocId !== '' ? Number(rawLocId) : '';

      const normalizedEtat = normalizeStatusForSelect(data.etat) || 'neuf';

      const formattedData = {
        type_bien: data.type_bien_info?.libelle || data.libelle || '',
        date_acquisition: data.date_acquisition ? data.date_acquisition.split('T')[0] : '',
        prix_acquisition: data.prix_acquisition !== undefined && data.prix_acquisition !== null
          ? data.prix_acquisition.toString()
          : '',
        etat: normalizedEtat,
        id_localisation: locId,
        description: data.description || '',
        image: data.image || null,
        qr_code: data.qr_code || '',
        attributs_specifiques: { ...attrs },
        images: data.images || []
      };

      setFormData(formattedData);
      setOriginalData(formattedData);
    } catch (err) {
      console.error('Erreur chargement bien:', err);
      setSubmitError('Impossible de charger les informations du bien');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GESTION DES CHAMPS
  // ============================================================
  const handleChange = (field, value) => {
    if (field === 'attributs_specifiques') {
      setFormData(prev => ({
        ...prev,
        attributs_specifiques: { ...prev.attributs_specifiques, ...value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSpecificFieldChange = (key, value) => {
    handleChange('attributs_specifiques', { [key]: value });
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // UPLOAD VERS CLOUDINARY
  // ============================================================
  const uploadImageToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    const response = await axios.post(CLOUDINARY_URL, fd);
    return { url: response.data.secure_url, public_id: response.data.public_id };
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!isTechnicianMode) {
        if (!formData.date_acquisition) newErrors.date_acquisition = 'Requis';
        if (!formData.prix_acquisition || parseFloat(formData.prix_acquisition) <= 0) {
          newErrors.prix_acquisition = 'Prix valide requis';
        }
      }
      if (!formData.id_localisation) newErrors.id_localisation = 'Requis';
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
  // SOUMISSION
  // ============================================================
  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    if (!hasChanges) {
      setSubmitError('Aucune modification à enregistrer');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload des nouvelles images vers Cloudinary
      let uploadedImagesData = [];
      if (imageFiles.length > 0) {
        try {
          uploadedImagesData = await Promise.all(
            imageFiles.map(file => uploadImageToCloudinary(file))
          );
        } catch (uploadErr) {
          console.error('Erreur upload Cloudinary:', uploadErr);
          setSubmitError('Erreur lors de l\'upload des images vers Cloudinary');
          setSubmitting(false);
          return;
        }
      }

      // 2. Construire la liste finale des images
      const finalImages = [...existingImages, ...uploadedImagesData];

      // 3. Préparer le payload
      const payload = {};

      // Champs communs
      const commonFields = isTechnicianMode
        ? ['etat', 'id_localisation', 'description']
        : ['date_acquisition', 'prix_acquisition', 'etat', 'id_localisation', 'description'];

      commonFields.forEach(key => {
        if (formData[key] !== originalData?.[key] && formData[key] !== '' && formData[key] !== null) {
          payload[key] = formData[key];
        }
      });

      // Attributs spécifiques (toujours envoyés en entier)
      const currentAttrs = formData.attributs_specifiques || {};
      if (Object.keys(currentAttrs).length > 0) {
        payload.attributs_specifiques = { ...currentAttrs };
      }

      // Images : les envoyer si la liste a changé (différence avec original)
      const originalImages = originalData?.images || [];
      if (finalImages.length !== originalImages.length ||
          finalImages.some((img, idx) => img.url !== originalImages[idx]?.url)) {
        payload.images = finalImages;
      }

      // ================================================================
      // TYPAGE STRICT — CRITIQUE POUR FASTAPI / PYDANTIC
      // ================================================================

      if ('etat' in payload) {
        const etatApi = normalizeStatusForAPI(payload.etat);
        if (etatApi) {
          payload.etat = etatApi;
        } else {
          delete payload.etat;
        }
      }

      if ('id_localisation' in payload) {
        const locInt = parseInt(payload.id_localisation, 10);
        if (!isNaN(locInt) && locInt > 0) {
          payload.id_localisation = locInt;
        } else {
          delete payload.id_localisation;
        }
      }

      if ('prix_acquisition' in payload) {
        const prix = parseFloat(payload.prix_acquisition);
        if (!isNaN(prix) && prix >= 0) {
          payload.prix_acquisition = prix;
        } else {
          delete payload.prix_acquisition;
        }
      }

      if ('date_acquisition' in payload && payload.date_acquisition) {
        payload.date_acquisition = String(payload.date_acquisition).split('T')[0];
      }

      if (Object.keys(payload).length === 0) {
        setSubmitError('Aucune modification valide à enregistrer');
        setSubmitting(false);
        return;
      }

      console.log('[EditBien] Payload envoyé →', JSON.stringify(payload, null, 2));

      await biensService.update(id, payload);
      navigate(`/biens/${id}`);

    } catch (err) {
      console.error('Erreur mise à jour:', err);
      const detail = err.response?.data?.detail;
      let message = 'Erreur lors de la mise à jour';

      if (Array.isArray(detail)) {
        message = detail.map(e => `${(e.loc || []).slice(1).join('.')}: ${e.msg}`).join(' | ');
      } else if (typeof detail === 'string') {
        message = detail;
      } else if (detail && typeof detail === 'object' && detail.msg) {
        message = detail.msg;
      }

      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDU DES CHAMPS SPÉCIFIQUES
  // ============================================================
  const renderSpecificFields = () => {
    const attrs = formData.attributs_specifiques || {};
    const keys = Object.keys(attrs);

    if (keys.length === 0) {
      return (
        <Alert severity="info">
          Aucune caractéristique spécifique définie pour ce bien.
        </Alert>
      );
    }

    return (
      <Grid container spacing={2}>
        {keys.map(key => {
          const value = attrs[key] !== undefined ? attrs[key] : '';
          const isNumber = typeof value === 'number' || !isNaN(parseFloat(value));
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          return (
            <Grid item xs={12} md={6} key={key}>
              <TextField
                fullWidth
                label={label}
                value={value}
                onChange={e => handleSpecificFieldChange(key, e.target.value)}
                type={isNumber ? 'number' : 'text'}
                inputProps={isNumber ? { step: "0.01", min: "0" } : {}}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // ============================================================
  // RENDU DE LA CONFIRMATION
  // ============================================================
  const renderConfirmation = () => {
    if (!originalData) return null;

    const changes = [];
    const commonFields = isTechnicianMode
      ? ['etat', 'id_localisation', 'description']
      : ['date_acquisition', 'prix_acquisition', 'etat', 'id_localisation', 'description'];

    commonFields.forEach(key => {
      if (formData[key] !== originalData[key] && formData[key] !== '' && originalData[key] !== null) {
        let oldVal = originalData[key];
        let newVal = formData[key];

        if (key === 'id_localisation') {
          const oldLoc = localisations.find(l => String(l.id_localisation) === String(oldVal));
          const newLoc = localisations.find(l => String(l.id_localisation) === String(newVal));
          oldVal = oldLoc ? oldLoc.nom_localisation : oldVal;
          newVal = newLoc ? newLoc.nom_localisation : newVal;
        }

        changes.push({
          field: key === 'id_localisation' ? 'localisation' : key.replace(/_/g, ' '),
          old: oldVal,
          new: newVal
        });
      }
    });

    // Attributs spécifiques
    const originalAttrs = originalData.attributs_specifiques || {};
    const currentAttrs = formData.attributs_specifiques || {};
    Object.keys(currentAttrs).forEach(key => {
      if (currentAttrs[key] !== originalAttrs[key] && currentAttrs[key] !== '' && originalAttrs[key] !== null) {
        changes.push({
          field: key.replace(/_/g, ' '),
          old: originalAttrs[key] || 'vide',
          new: currentAttrs[key] || 'vide'
        });
      }
    });

    // Images
    const originalImages = originalData.images || [];
    const currentImages = existingImages;
    if (currentImages.length !== originalImages.length ||
        currentImages.some((img, idx) => img.url !== originalImages[idx]?.url) ||
        imageFiles.length > 0) {
      changes.push({
        field: 'Photos',
        old: `${originalImages.length} photo(s)`,
        new: `${currentImages.length + imageFiles.length} photo(s)`
      });
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Récapitulatif des modifications</Typography>

        {changes.length === 0 ? (
          <Alert severity="info">Aucune modification détectée</Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
            {changes.map((change, idx) => (
              <Box key={idx} sx={{ py: 1, borderBottom: idx < changes.length - 1 ? '1px solid #eee' : 'none' }}>
                <Typography variant="body2" fontWeight={500}>
                  {change.field}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                  <Typography variant="caption" color="error" sx={{ textDecoration: 'line-through' }}>
                    {change.old}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    → {change.new}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        )}

        <Alert severity="warning" icon={<Warning />}>
          Les modifications seront appliquées immédiatement. L'historique des changements est conservé dans le journal d'audit.
        </Alert>
      </Box>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!typeLibelle && submitError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{submitError}</Alert>
        <Button onClick={() => navigate('/biens')} sx={{ mt: 2 }}>
          RETOUR
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {isTechnicianMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Mode technicien</strong> — Seuls l&apos;état, la localisation et les caractéristiques techniques sont modifiables.
        </Alert>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(`/biens/${id}`)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4">Modifier le bien</Typography>
          <Typography variant="body2" color="text.secondary">
            {typeLibelle} • QR: {formData.qr_code || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {!hasChanges && activeStep === 2 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Aucune modification à enregistrer
          </Alert>
        )}

        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Type de bien"
                value={typeLibelle}
                disabled
                helperText="Le type ne peut pas être modifié après création"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>État</InputLabel>
                <Select
                  value={formData.etat || ''}
                  label="État"
                  onChange={e => handleChange('etat', e.target.value)}
                >
                  {getEtatSelectOptions().map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {!isTechnicianMode && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date d'acquisition *"
                    type="date"
                    value={formData.date_acquisition || ''}
                    onChange={e => handleChange('date_acquisition', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date_acquisition}
                    helperText={errors.date_acquisition}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Prix d'acquisition *"
                    type="number"
                    value={formData.prix_acquisition || ''}
                    onChange={e => handleChange('prix_acquisition', e.target.value)}
                    error={!!errors.prix_acquisition}
                    helperText={errors.prix_acquisition}
                    inputProps={{ min: "0", step: "0.01" }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.id_localisation}>
                <InputLabel id="localisation-label">Localisation *</InputLabel>
                <Select
                  labelId="localisation-label"
                  value={formData.id_localisation || ''}
                  label="Localisation *"
                  onChange={e => handleChange('id_localisation', e.target.value)}
                  disabled={localisationsLoading}
                >
                  {localisations.map(loc => (
                    <MenuItem key={loc.id_localisation} value={loc.id_localisation}>
                      {loc.nom_localisation}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_localisation && <FormHelperText>{errors.id_localisation}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={e => handleChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            {/* ============================================================
                SECTION PHOTOS
            ============================================================ */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Photos du bien (max 4)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {existingImages.map((img, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid #ddd',
                      bgcolor: '#f5f5f5',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={img.url}
                      alt={`photo ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Tooltip title="Supprimer cette photo">
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'rgba(255,0,0,0.2)' },
                          width: 20,
                          height: 20,
                          p: 0
                        }}
                        onClick={() => handleRemoveExistingImage(idx)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
              <ImageUpload
                maxFiles={4 - existingImages.length}
                maxSizeMB={1}
                onChange={setImageFiles}
              />
              <Typography variant="caption" color="text.secondary">
                {existingImages.length + imageFiles.length} / 4 photos
              </Typography>
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Modifier les caractéristiques de {typeLibelle}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderSpecificFields()}
          </>
        )}

        {activeStep === 2 && renderConfirmation()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || submitting}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Retour
          </Button>

          <Box>
            {activeStep === 2 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting || !hasChanges}
                startIcon={<Save />}
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={submitting}
              >
                Suivant
              </Button>
            )}
            <Button
              sx={{ ml: 1 }}
              onClick={() => navigate(`/biens/${id}`)}
              disabled={submitting}
              startIcon={<Cancel />}
            >
              Annuler
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditBien;