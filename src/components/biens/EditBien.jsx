// frontend/src/components/biens/EditBien.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, Button,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  Alert, FormHelperText, CircularProgress, Divider, IconButton
} from '@mui/material';
import { ArrowBack, Save, Cancel, Warning } from '@mui/icons-material';
import { biensService } from '../../services/biens';
import usePermissions from '../../hooks/usePermissions';
import { TYPE_BIEN_LABELS, CHAMPS_SPECIFIQUES } from '../../utils/constants';
import { localisationsService } from '../../services/localisations';
import {
  normalizeStatusForSelect,
  normalizeStatusForAPI,
  getEtatSelectOptions,
} from '../../utils/statusNormalizer';

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

  const steps = ['Informations générales', 'Caractéristiques spécifiques', 'Confirmation'];

  // Chargement des localisations
  useEffect(() => {
    const loadLocalisations = async () => {
      try {
        setLocalisationsLoading(true);
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

  // Chargement des données existantes
  useEffect(() => {
    if (authLoading) return;

    if (!canEditBien) {
      navigate('/unauthorized');
      return;
    }

    fetchBien();
  }, [id, canEditBien, authLoading, navigate]);

  // Détection des modifications
  useEffect(() => {
    if (originalData && formData) {
      const changes = Object.keys(formData).some(key =>
        formData[key] !== originalData[key] &&
        formData[key] !== '' &&
        originalData[key] !== null
      );
      setHasChanges(changes);
    }
  }, [formData, originalData]);

  const fetchBien = async () => {
    try {
      setLoading(true);
      const data = await biensService.getById(id);
      
      // ✅ Initialiser tous les champs avec des valeurs par défaut
      setFormData({
        // Champs communs
        type_bien: data.type_bien || '',
        date_acquisition: data.date_acquisition?.split('T')[0] || '',
        prix_acquisition: data.prix_acquisition?.toString() || '',
        etat: normalizeStatusForSelect(data.etat) || 'neuf',
        id_localisation: data.id_localisation || data.localisation?.id_localisation || '',
        description: data.description || '',
        image: data.image || null,
        qr_code: data.qr_code || '',
        // Champs véhicule
        type_vehicule: data.type_vehicule || '',
        marque: data.marque || '',
        modele: data.modele || '',
        immatriculation: data.immatriculation || '',
        poids: data.poids?.toString() || '',
        dimension: data.dimension || '',
        type_de_carburant: data.type_de_carburant || '',
        consommation_carburant: data.consommation_carburant?.toString() || '',
        consommation_huile: data.consommation_huile?.toString() || '',
        type_propulsion: data.type_propulsion || '',
        // Champs machine
        numero_serie: data.numero_serie || '',
        fabricant: data.fabricant || '',
        puissance: data.puissance?.toString() || '',
        type_alimentation: data.type_alimentation || '',
        tension_normal: data.tension_normal || '',
        service_affecte: data.service_affecte || '',
        responsable: data.responsable || '',
        consommation_elec: data.consommation_elec?.toString() || '',
        frequence_maintenance: data.frequence_maintenance || '',
        // Champs ordinateur
        processeur: data.processeur || '',
        ram: data.ram || '',
        stockage: data.stockage || '',
        adresse_ip: data.adresse_ip || '',
        utilisateur_affecte: data.utilisateur_affecte || ''
      });
      
      setOriginalData({
        ...data,
        etat: normalizeStatusForSelect(data.etat) || data.etat,
        id_localisation: data.id_localisation || data.localisation?.id_localisation || '',
        qr_code: data.qr_code || '',
      });
    } catch (err) {
      console.error('Erreur chargement bien:', err);
      setSubmitError('Impossible de charger le bien');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

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

    if (step === 1 && formData.type_bien) {
      if (formData.type_bien === 'vehicule') {
        if (!formData.marque) newErrors.marque = 'Requis';
        if (!formData.immatriculation) newErrors.immatriculation = 'Requis';
      } else if (formData.type_bien === 'machine') {
        if (!formData.fabricant) newErrors.fabricant = 'Requis';
        if (!formData.numero_serie) newErrors.numero_serie = 'Requis';
      } else if (formData.type_bien === 'ordinateur') {
        if (!formData.marque) newErrors.marque = 'Requis';
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

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    if (!hasChanges) {
      setSubmitError('Aucune modification à enregistrer');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Préparer le payload (ne garder que les champs modifiés et non vides)
      const payload = {};
      const commonFields = isTechnicianMode
        ? ['etat', 'id_localisation', 'description']
        : ['date_acquisition', 'prix_acquisition', 'etat', 'id_localisation', 'description'];
      const specificFields = CHAMPS_SPECIFIQUES[formData.type_bien] || [];
      
      [...commonFields, ...specificFields].forEach(key => {
        if (formData[key] !== originalData?.[key] && formData[key] !== '' && formData[key] !== null) {
          payload[key] = formData[key];
        }
      });

      if (payload.id_localisation) payload.id_localisation = parseInt(payload.id_localisation, 10);

      if (payload.etat) payload.etat = normalizeStatusForAPI(payload.etat);
      if (payload.prix_acquisition) payload.prix_acquisition = parseFloat(payload.prix_acquisition);
      if (payload.poids) payload.poids = parseFloat(payload.poids);
      if (payload.puissance) payload.puissance = parseFloat(payload.puissance);
      if (payload.consommation_carburant) payload.consommation_carburant = parseFloat(payload.consommation_carburant);
      if (payload.consommation_huile) payload.consommation_huile = parseFloat(payload.consommation_huile);
      if (payload.consommation_elec) payload.consommation_elec = parseFloat(payload.consommation_elec);
      
      await biensService.update(id, payload);
      navigate(`/biens/${id}`);
      
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setSubmitError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSpecificFields = () => {
    const type = formData.type_bien;
    if (!type) {
      return <Alert severity="info">Type de bien non défini</Alert>;
    }

    const champs = CHAMPS_SPECIFIQUES[type] || [];
    
    return (
      <Grid container spacing={2}>
        {champs.map(field => {
          const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const isNumber = ['poids', 'puissance', 'consommation_carburant', 'consommation_huile', 'consommation_elec'].includes(field);
          const isRequired = ['marque', 'modele', 'immatriculation', 'fabricant', 'numero_serie'].includes(field);
          
          return (
            <Grid item xs={12} md={6} key={field}>
              <TextField
                fullWidth
                label={`${label}${isRequired ? ' *' : ''}`}
                value={formData[field] || ''}
                onChange={e => handleChange(field, e.target.value)}
                error={!!errors[field]}
                helperText={errors[field]}
                type={isNumber ? 'number' : 'text'}
                inputProps={isNumber ? { step: "0.01", min: "0" } : {}}
                disabled={field === 'type_bien'}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderConfirmation = () => {
    if (!originalData) return null;
    
    const changes = [];
    const commonFields = isTechnicianMode
      ? ['etat', 'id_localisation', 'description']
      : ['date_acquisition', 'prix_acquisition', 'etat', 'id_localisation', 'description'];
    const specificFields = CHAMPS_SPECIFIQUES[formData.type_bien] || [];

    [...commonFields, ...specificFields].forEach(key => {
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

  // ✅ Affichage pendant le chargement de l'authentification
  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ✅ Vérification si le type de bien est défini
  if (!formData.type_bien) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bien non trouvé ou inaccessible</Alert>
        <Button onClick={() => navigate('/biens')} sx={{ mt: 2 }}>
          Retour
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
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(`/biens/${id}`)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4">Modifier le bien</Typography>
          <Typography variant="body2" color="text.secondary">
            {TYPE_BIEN_LABELS[formData.type_bien]} • QR: {formData.qr_code || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Messages */}
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

        {/* Contenu par étape */}
        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Type de bien"
                value={TYPE_BIEN_LABELS[formData.type_bien] || ''}
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
          </Grid>
        )}

        {activeStep === 1 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Modifier les caractéristiques de {TYPE_BIEN_LABELS[formData.type_bien]?.toLowerCase() || 'ce bien'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderSpecificFields()}
          </>
        )}

        {activeStep === 2 && renderConfirmation()}

        {/* Boutons */}
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