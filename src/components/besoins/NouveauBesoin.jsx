import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, Button,
  Grid, Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, IconButton,
  InputAdornment
} from '@mui/material';
import { ArrowBack, Add, Remove, Save, Search } from '@mui/icons-material';
import { besoinsService } from '../../services/besoins';
import { piecesService } from '../../services/pieces';
import { pannesService } from '../../services/pannes';
import { formatPrice } from '../../utils/formatters';

const NouveauBesoin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const panneId = searchParams.get('panne_id');
  const pieceIdFromUrl = searchParams.get('piece_id'); // ✅ NOUVEAU

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panne, setPanne] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [filteredPieces, setFilteredPieces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [observations, setObservations] = useState('');
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Sélection des pièces', 'Récapitulatif', 'Confirmation'];

  // ✅ NOUVEAU : Ajouter automatiquement la pièce si piece_id est fourni
  const autoAddPiece = async (pieceId) => {
    try {
      const piece = await piecesService.getById(pieceId);
      if (piece) {
        setSelectedPieces([{
          id_piece: piece.id_piece,
          reference: piece.reference,
          designation: piece.designation,
          prix_unitaire: piece.prix_achat,
          quantite: 1,
          prix_total: piece.prix_achat
        }]);
      }
    } catch (err) {
      console.error('Erreur chargement pièce:', err);
    }
  };

  useEffect(() => {
    if (panneId) {
      loadData();
    } else if (pieceIdFromUrl) {
      // ✅ Si pas de panneId mais pieceId, charger uniquement le catalogue
      loadCatalogueOnly();
    }
  }, [panneId, pieceIdFromUrl]);

  // ✅ NOUVEAU : Charger uniquement le catalogue (sans panne)
  const loadCatalogueOnly = async () => {
    try {
      setLoading(true);
      const piecesData = await piecesService.getAll({ est_active: true });
      setPieces(piecesData);
      setFilteredPieces(piecesData);
      
      // Ajouter automatiquement la pièce
      await autoAddPiece(parseInt(pieceIdFromUrl));
    } catch (err) {
      setError('Impossible de charger les données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [panneData, piecesData] = await Promise.all([
        pannesService.getById(panneId),
        piecesService.getAll({ est_active: true })
      ]);
      setPanne(panneData);
      setPieces(piecesData);
      setFilteredPieces(piecesData);
    } catch (err) {
      setError('Impossible de charger les données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterPieces = () => {
    if (!searchTerm) {
      setFilteredPieces(pieces);
    } else {
      const filtered = pieces.filter(piece =>
        piece.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPieces(filtered);
    }
  };

  useEffect(() => {
    filterPieces();
  }, [searchTerm, pieces]);

  const handleAddPiece = (piece) => {
    const existing = selectedPieces.find(p => p.id_piece === piece.id_piece);
    if (existing) {
      setSelectedPieces(selectedPieces.map(p =>
        p.id_piece === piece.id_piece
          ? { ...p, quantite: p.quantite + 1, prix_total: (p.quantite + 1) * p.prix_unitaire }
          : p
      ));
    } else {
      setSelectedPieces([...selectedPieces, {
        id_piece: piece.id_piece,
        reference: piece.reference,
        designation: piece.designation,
        prix_unitaire: piece.prix_achat,
        quantite: 1,
        prix_total: piece.prix_achat
      }]);
    }
  };

  const handleRemovePiece = (pieceId) => {
    setSelectedPieces(selectedPieces.filter(p => p.id_piece !== pieceId));
  };

  const handleUpdateQuantite = (pieceId, newQuantite) => {
    if (newQuantite < 1) {
      handleRemovePiece(pieceId);
      return;
    }
    setSelectedPieces(selectedPieces.map(p =>
      p.id_piece === pieceId
        ? { ...p, quantite: newQuantite, prix_total: newQuantite * p.prix_unitaire }
        : p
    ));
  };

  const getTotalAmount = () => {
    return selectedPieces.reduce((sum, p) => sum + p.prix_total, 0);
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedPieces.length === 0) {
      setError('Veuillez sélectionner au moins une pièce');
      return;
    }
    setError(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (selectedPieces.length === 0) {
      setError('Veuillez sélectionner au moins une pièce');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        id_panne: panneId ? parseInt(panneId) : null,
        observations: observations,
        lignes: selectedPieces.map(p => ({
          id_piece: p.id_piece,
          quantite: p.quantite
        }))
      };

      const result = await besoinsService.create(payload);
      
      // Redirection après création
      if (panneId) {
        navigate(`/pannes/${panneId}`);
      } else {
        navigate(`/besoins/${result.id_besoin}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(panneId ? `/pannes/${panneId}` : '/pieces')}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4">Créer un état des besoins</Typography>
          <Typography variant="body2" color="text.secondary">
            {panneId ? `Panne #${panneId} - ${panne?.type_panne}` : 'Création directe depuis une alerte stock'}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Étape 1 : Sélection des pièces */}
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>Catalogue des pièces</Typography>
              <TextField
                fullWidth
                placeholder="Rechercher par référence ou désignation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Référence</TableCell>
                      <TableCell>Désignation</TableCell>
                      <TableCell align="right">Prix</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPieces.map(piece => (
                      <TableRow key={piece.id_piece} hover>
                        <TableCell>{piece.reference}</TableCell>
                        <TableCell>{piece.designation}</TableCell>
                        <TableCell align="right">{formatPrice(piece.prix_achat)}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => handleAddPiece(piece)}
                          >
                            Ajouter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>Pièces sélectionnées</Typography>
              {selectedPieces.length === 0 ? (
                <Alert severity="info">Aucune pièce sélectionnée</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pièce</TableCell>
                        <TableCell align="center">Qté</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPieces.map(piece => (
                        <TableRow key={piece.id_piece}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {piece.designation}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {piece.reference}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantite(piece.id_piece, piece.quantite - 1)}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                              <Typography variant="body2" fontWeight={500}>
                                {piece.quantite}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantite(piece.id_piece, piece.quantite + 1)}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatPrice(piece.prix_total)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemovePiece(piece.id_piece)}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {selectedPieces.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="h6" align="right">
                    Total: {formatPrice(getTotalAmount())}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {/* Étape 2 : Récapitulatif */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Récapitulatif</Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Référence</TableCell>
                    <TableCell>Désignation</TableCell>
                    <TableCell align="center">Quantité</TableCell>
                    <TableCell align="right">Prix unitaire</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPieces.map(piece => (
                    <TableRow key={piece.id_piece}>
                      <TableCell>{piece.reference}</TableCell>
                      <TableCell>{piece.designation}</TableCell>
                      <TableCell align="center">{piece.quantite}</TableCell>
                      <TableCell align="right">{formatPrice(piece.prix_unitaire)}</TableCell>
                      <TableCell align="right">{formatPrice(piece.prix_total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TextField
              fullWidth
              label="Observations (optionnel)"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              multiline
              rows={3}
              placeholder="Ajouter des commentaires sur ce besoin..."
            />
          </Box>
        )}

        {/* Étape 3 : Confirmation */}
        {activeStep === 2 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Prêt à créer l'état des besoins
            </Alert>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Résumé</Typography>
              <Grid container spacing={2}>
                {panneId && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Panne</Typography>
                    <Typography variant="body1" fontWeight={500}>#{panneId}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Nombre de pièces</Typography>
                  <Typography variant="body1" fontWeight={500}>{selectedPieces.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Montant total</Typography>
                  <Typography variant="body1" fontWeight={500} color="primary">
                    {formatPrice(getTotalAmount())}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Observations</Typography>
                  <Typography variant="body1">
                    {observations || 'Aucune'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="warning">
              Une fois créé, l'état des besoins sera soumis au circuit de validation (DG → Comptable → Caisse).
            </Alert>
          </Box>
        )}

        {/* Boutons de navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || submitting}
            onClick={handleBack}
          >
            Retour
          </Button>
          
          <Box>
            {activeStep === 2 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={<Save />}
              >
                {submitting ? 'Création...' : 'Créer l\'état des besoins'}
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
              onClick={() => navigate(panneId ? `/pannes/${panneId}` : '/pieces')}
              disabled={submitting}
            >
              Annuler
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default NouveauBesoin;