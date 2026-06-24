import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  CircularProgress, Alert
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Edit, Delete, Add } from '@mui/icons-material';
import { okapiMuiTheme } from '../../theme/muiTheme';
import { composantsService } from '../../services/composants';
import { formatDate } from '../../utils/formatters';
import ConfirmDialog from '../common/ConfirmDialog';

const toDateInputValue = (value) => {
  const { t } = useTranslation();
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatReplacementDate = (value) => {
  if (!value) return '—';
  const formatted = formatDate(value);
  return formatted === '-' ? '—' : formatted;
};

const ComposantsList = ({ bienId, onRefresh, readOnly = false }) => {
  const [composants, setComposants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingComposant, setEditingComposant] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [error, setError] = useState(null);

  const fetchComposants = async () => {
    if (!bienId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await composantsService.getByBienId(bienId);
      setComposants(response.composants || []);
    } catch (err) {
      console.error('Erreur chargement composants:', err);
      setError('Impossible de charger les composants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComposants();
  }, [bienId]);

  const handleDelete = async (id) => {
    try {
      await composantsService.delete(id);
      fetchComposants();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Fonction pour ouvrir le formulaire d'ajout
  const handleOpenAddForm = () => {
    setEditingComposant(null);
    setShowForm(true);
  };

  // Fonction pour ouvrir le formulaire de modification
  const handleOpenEditForm = (composant) => {
    setEditingComposant(composant);
    setShowForm(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (composants.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Aucun composant défini pour ce bien
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Décomposez ce bien en composants pour un amortissement différencié (OHADA)
        </Typography>
        {!readOnly && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAddForm}
            size="large"
          >
            Ajouter un composant
          </Button>
        )}

        {/* Formulaire Modal - À l'intérieur du if */}
        {showForm && (
          <ComposantForm
            bienId={bienId}
            composant={editingComposant}
            onClose={() => {
              setShowForm(false);
              setEditingComposant(null);
            }}
            onSuccess={() => {
              fetchComposants();
              if (onRefresh) onRefresh();
              setShowForm(false);
              setEditingComposant(null);
            }}
            onError={(msg) => setError(msg)}
          />
        )}
      </Paper>
    );
  }

  return (
    <ThemeProvider theme={okapiMuiTheme}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Composants décomposés ({composants.length})</Typography>
          {!readOnly && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAddForm}
            >
              Ajouter
            </Button>
          )}
        </Box>


        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Désignation</TableCell>
                <TableCell align="right">Valeur (USD)</TableCell>
                <TableCell align="center">Durée de vie</TableCell>
                <TableCell align="center">Date remplacement</TableCell>
                {!readOnly && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {composants.map((comp) => (
                <TableRow key={comp.id_composant} hover>
                  <TableCell>{comp.designation}</TableCell>
                  <TableCell align="right">{comp.valeur.toLocaleString()}</TableCell>
                  <TableCell align="center">{comp.duree_vie_ans} ans</TableCell>
                  <TableCell align="center">{formatReplacementDate(comp.date_remplacement)}</TableCell>
                  {!readOnly && (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEditForm(comp)}
                        sx={{ mr: 1 }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirm({ open: true, id: comp.id_composant })}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Formulaire Modal */}
        {showForm && (
          <ComposantForm
            bienId={bienId}
            composant={editingComposant}
            onClose={() => {
              setShowForm(false);
              setEditingComposant(null);
            }}
            onSuccess={() => {
              fetchComposants();
              if (onRefresh) onRefresh();
              setShowForm(false);
              setEditingComposant(null);
            }}
            onError={(msg) => setError(msg)}
          />
        )}

        {/* Dialog Confirmation */}
        <ConfirmDialog
          open={deleteConfirm.open}
          title="Supprimer le composant"
          content="Êtes-vous sûr de vouloir supprimer ce composant ? Cette action est irréversible."
          onConfirm={() => {
            handleDelete(deleteConfirm.id);
            setDeleteConfirm({ open: false, id: null });
          }}
          onCancel={() => setDeleteConfirm({ open: false, id: null })}
        />
      </Box>
    </ThemeProvider>
  );
};

// Composant Formulaire séparé - VERSION CORRIGÉE
const ComposantForm = ({ bienId, composant, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    designation: composant?.designation || '',
    valeur: composant?.valeur || '',
    duree_vie_ans: composant?.duree_vie_ans || 5,
    date_remplacement: toDateInputValue(composant?.date_remplacement),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        designation: formData.designation,
        valeur: parseFloat(formData.valeur),
        duree_vie_ans: parseInt(formData.duree_vie_ans)
      };

      // Ajouter date_remplacement si présente
      if (formData.date_remplacement) {
        payload.date_remplacement = new Date(`${formData.date_remplacement}T00:00:00`).toISOString();
      }

      if (composant) {
        // Mode modification
        await composantsService.update(composant.id_composant, payload);
      } else {
        // Mode création
        await composantsService.create({
          id_bien: bienId,
          ...payload
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Erreur enregistrement:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Erreur lors de l\'enregistrement';
      if (onError) onError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {composant ? 'Modifier le composant' : 'Ajouter un composant'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Désignation *"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
              fullWidth
              placeholder="Ex: Moteur, Batterie, Carrosserie..."
              autoFocus
            />
            <TextField
              label="Valeur (USD) "
              type="number"
              value={formData.valeur}
              onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              placeholder="Ex: 5000000"
            />
            <TextField
              label="Durée de vie (années) *"
              type="number"
              value={formData.duree_vie_ans}
              onChange={(e) => setFormData({ ...formData, duree_vie_ans: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 1, max: 50 }}
              helperText="Durée d'amortissement selon OHADA"
            />
            <TextField
              label="Date de remplacement (optionnel)"
              type="date"
              value={formData.date_remplacement}
              onChange={(e) => setFormData({ ...formData, date_remplacement: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Date prévue ou effective du remplacement"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="inherit">
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Enregistrement...' : (composant ? 'Modifier' : 'Ajouter')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ComposantsList;