// frontend/src/components/besoins/FicheBesoin.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, StepContent,
  Button, Grid, Chip, Divider, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Cancel, HourglassEmpty,
  Comment, History, Receipt, Inventory, Print
} from '@mui/icons-material';
import { besoinsService } from '../../services/besoins';
import etatsService from '../../services/etats';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatPrice } from '../../utils/formatters';

const FicheBesoin = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  
  const [besoin, setBesoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationDecision, setValidationDecision] = useState('APPROUVE');
  const [validationComment, setValidationComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const STATUT_COLORS = {
    'BROUILLON': { color: 'default', label: 'Brouillon' },
    'EN_VALIDATION': { color: 'warning', label: 'En validation' },
    'DG_VALIDE': { color: 'info', label: 'DG Validé' },
    'COMPTABLE_VALIDE': { color: 'info', label: 'Comptable Validé' },
    'CAISSE_VALIDE': { color: 'info', label: 'Caisse Validé' },
    'APPROUVEE': { color: 'success', label: 'Approuvée' },
    'REJETE': { color: 'error', label: 'Rejetée' }
  };

  const WORKFLOW_STEPS = [
    { ordre: 'DG', label: 'Directeur Général', role: 'DG' },
    { ordre: 'COMPTABLE', label: 'Service Comptable', role: 'COMPTABLE' },
    { ordre: 'CAISSE', label: 'Service Caisse', role: 'CAISSE' }
  ];

  useEffect(() => {
    fetchBesoin();
  }, [id]);

  const fetchBesoin = async () => {
    try {
      setLoading(true);
      const data = await besoinsService.getById(id);
      setBesoin(data);
    } catch (err) {
      setError('Impossible de charger le besoin');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canValidate = () => {
    if (!user || !besoin) return false;
    const userRole = user.role?.nom?.toUpperCase();
    
    if (userRole === 'ADMIN' || userRole === 'DG') return true;
    if (userRole === 'COMPTABLE' && besoin.statut === 'DG_VALIDE') return true;
    if (userRole === 'CAISSE' && besoin.statut === 'COMPTABLE_VALIDE') return true;
    
    return false;
  };

  const getCurrentStepIndex = () => {
    if (!besoin) return 0;
    
    switch (besoin.statut) {
      case 'BROUILLON': return 0;
      case 'EN_VALIDATION': 
      case 'DG_VALIDE': return 1;
      case 'COMPTABLE_VALIDE': return 2;
      case 'CAISSE_VALIDE': 
      case 'APPROUVEE': return 3;
      default: return 0;
    }
  };

  const handleValidation = async () => {
    try {
      setSubmitting(true);
      await besoinsService.valider(id, validationDecision, validationComment);
      setShowValidationModal(false);
      fetchBesoin();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la validation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportEtatSortie = async () => {
    try {
      setPrinting(true);
      await etatsService.exportEtatBesoins(id);
    } catch (err) {
      alert(err.message || 'Erreur lors de la génération du PDF');
    } finally {
      setPrinting(false);
    }
  };

  const handleApercuImpression = () => {
    window.open(`/prints/etat-besoin/${id}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !besoin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Besoin non trouvé'}</Alert>
        <Button onClick={() => navigate('/validations')} sx={{ mt: 2 }} startIcon={<ArrowBack />}>
          Retour
        </Button>
      </Box>
    );
  }

  const statutInfo = STATUT_COLORS[besoin.statut] || STATUT_COLORS.BROUILLON;
  const currentStep = getCurrentStepIndex();

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button onClick={() => navigate('/validations')} startIcon={<ArrowBack />}>
          Retour
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">
            <Receipt sx={{ verticalAlign: 'middle', mr: 1 }} />
            Demande {besoin.numero_demande}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Créée le {formatDate(besoin.date_creation)}
          </Typography>
        </Box>
        <Chip 
          label={statutInfo.label} 
          color={statutInfo.color}
          sx={{ fontSize: '1rem', px: 2, py: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={handleApercuImpression}
        >
          Aperçu
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<Print />}
          onClick={handleExportEtatSortie}
          disabled={printing}
        >
          {printing ? 'Génération...' : 'État de sortie PDF'}
        </Button>
      </Box>

      {/* Informations générales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Montant total</Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {formatPrice(besoin.montant_total)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Nombre de pièces</Typography>
            <Typography variant="h6">
              <Inventory sx={{ verticalAlign: 'middle', mr: 1 }} />
              {besoin.lignes?.length || 0}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Panne associée</Typography>
            <Typography variant="body2">
              #{besoin.id_panne}
            </Typography>
          </Grid>
        </Grid>

        {besoin.observations && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Observations:
            </Typography>
            <Typography variant="body2">{besoin.observations}</Typography>
          </Box>
        )}
      </Paper>

      {/* Workflow de validation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History /> Workflow de validation
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Stepper activeStep={currentStep} orientation="vertical">
          {WORKFLOW_STEPS.map((step, index) => {
            const validation = besoin.validations?.find(v => v.ordre_validateur === step.ordre);
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <Step key={step.ordre} expanded={isCurrent || isCompleted}>
                <StepLabel
                  error={validation?.decision === 'REJETE'}
                  StepIconComponent={() => (
                    validation?.decision === 'REJETE' ? (
                      <Cancel color="error" />
                    ) : validation?.decision === 'APPROUVE' ? (
                      <CheckCircle color="success" />
                    ) : isCurrent ? (
                      <HourglassEmpty color="warning" />
                    ) : isCompleted ? (
                      <CheckCircle color="success" />
                    ) : (
                      <HourglassEmpty color="disabled" />
                    )
                  )}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {validation ? (
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2">
                        <strong>Validateur:</strong> {validation.validateur?.nom || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong> {formatDate(validation.date_validation)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Décision:</strong> {validation.decision}
                      </Typography>
                      {validation.commentaire && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <Comment fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                          {validation.commentaire}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      En attente de validation...
                    </Typography>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Liste des pièces */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory /> Pièces demandées
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Référence</strong></TableCell>
                <TableCell><strong>Désignation</strong></TableCell>
                <TableCell align="center"><strong>Quantité</strong></TableCell>
                <TableCell align="right"><strong>Prix unitaire</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {besoin.lignes?.map((ligne, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {ligne.reference_piece}
                    </Typography>
                  </TableCell>
                  <TableCell>{ligne.designation_piece}</TableCell>
                  <TableCell align="center">{ligne.quantite}</TableCell>
                  <TableCell align="right">{formatPrice(ligne.prix_unitaire)}</TableCell>
                  <TableCell align="right" fontWeight="bold">
                    {formatPrice(ligne.prix_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Actions */}
      {canValidate() && besoin.statut !== 'APPROUVEE' && besoin.statut !== 'REJETE' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Actions</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowValidationModal(true)}
              startIcon={<CheckCircle />}
            >
              Valider la demande
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setValidationDecision('REJETE');
                setShowValidationModal(true);
              }}
              startIcon={<Cancel />}
            >
              Rejeter
            </Button>
          </Box>
        </Paper>
      )}

      {/* Modal de validation */}
      <Dialog open={showValidationModal} onClose={() => setShowValidationModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {validationDecision === 'APPROUVE' ? 'Approuver la demande' : 'Rejeter la demande'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Demande: <strong>{besoin.numero_demande}</strong>
            </Typography>
            <Typography variant="body2" gutterBottom>
              Montant: <strong>{formatPrice(besoin.montant_total)}</strong>
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Commentaire (optionnel)"
            value={validationComment}
            onChange={(e) => setValidationComment(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Ajoutez un commentaire sur votre décision..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationModal(false)}>Annuler</Button>
          <Button
            onClick={handleValidation}
            variant="contained"
            color={validationDecision === 'APPROUVE' ? 'success' : 'error'}
            disabled={submitting}
          >
            {submitting ? 'Traitement...' : (validationDecision === 'APPROUVE' ? 'Approuver' : 'Rejeter')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FicheBesoin;