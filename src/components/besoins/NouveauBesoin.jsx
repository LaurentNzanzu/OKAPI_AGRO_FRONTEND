import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, Button,
  Grid, Alert, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, IconButton,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack, Add, Remove, Save, Search, Inventory2 } from '@mui/icons-material';
import { besoinsService } from '../../services/besoins';
import { piecesService } from '../../services/pieces';
import { pannesService } from '../../services/pannes';
import { formatPrice } from '../../utils/formatters';

const NouveauBesoin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const panneId = searchParams.get('panne_id');
  const pieceIdFromUrl = searchParams.get('piece_id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [panne, setPanne] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [filteredPieces, setFilteredPieces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPieces, setSelectedPieces] = useState([]);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showHorsCatalogueModal, setShowHorsCatalogueModal] = useState(false);
  const [horsCatalogueData, setHorsCatalogueData] = useState({
    designation: '',
    prix: 0,
    quantite: 1
  });

  const steps = ['Sélection des pièces', 'Récapitulatif', 'Confirmation'];

  useEffect(() => {
    if (panneId) {
      loadData();
    } else if (pieceIdFromUrl) {
      loadCatalogueOnly();
    }
  }, [panneId, pieceIdFromUrl]);

  const loadCatalogueOnly = async () => {
    try {
      setLoading(true);
      const piecesData = await piecesService.getAll({ est_active: true });
      setPieces(piecesData);
      setFilteredPieces(piecesData);
      if (pieceIdFromUrl) {
        await autoAddPiece(parseInt(pieceIdFromUrl));
      }
    } catch (err) {
      console.error('Erreur chargement catalogue:', err);
      setError('Impossible de charger le catalogue des pièces');
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
      console.error('Erreur chargement données:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

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
          prix_total: piece.prix_achat,
          est_hors_catalogue: false
        }]);
      }
    } catch (err) {
      console.error('Erreur chargement pièce:', err);
      setError('Impossible de charger la pièce automatiquement');
    }
  };

  const filterPieces = () => {
    if (!searchTerm) {
      setFilteredPieces(pieces);
    } else {
      const filtered = pieces.filter(piece =>
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
        prix_total: piece.prix_achat,
        est_hors_catalogue: false
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

  const handleAddHorsCatalogue = () => {
    if (!horsCatalogueData.designation || horsCatalogueData.prix <= 0) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }

    const tempId = `HC-${Date.now()}`;

    setSelectedPieces([...selectedPieces, {
      id_piece: null,
      temp_id: tempId,
      reference: `HC-${Date.now()}`,
      designation: horsCatalogueData.designation.trim(),
      prix_unitaire: horsCatalogueData.prix,
      quantite: horsCatalogueData.quantite,
      prix_total: horsCatalogueData.prix * horsCatalogueData.quantite,
      est_hors_catalogue: true
    }]);

    setShowHorsCatalogueModal(false);
    setHorsCatalogueData({ designation: '', prix: 0, quantite: 1 });
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
    setError(null);
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

      const lignes = selectedPieces.map(p => {
        if (p.est_hors_catalogue) {
          return {
            id_piece: null,
            designation: p.designation.trim(),
            prix_unitaire: parseFloat(p.prix_unitaire),
            quantite: parseInt(p.quantite)
          };
        } else {
          return {
            id_piece: parseInt(p.id_piece),
            quantite: parseInt(p.quantite)
          };
        }
      });

      const payload = {
        id_panne: panneId ? parseInt(panneId) : null,
        lignes: lignes
      };

      console.log('📤 Payload envoyé au backend:', JSON.stringify(payload, null, 2));

      const result = await besoinsService.create(payload);

      if (panneId) {
        navigate(`/pannes/${panneId}`);
      } else {
        navigate(`/besoins/${result.id_besoin}`);
      }

    } catch (err) {
      console.error('❌ Erreur de création:', err);

      if (err.response?.status === 422) {
        const details = err.response.data?.detail;
        if (Array.isArray(details)) {
          const messages = details.map(d => {
            const field = d.loc ? d.loc.join(' -> ') : 'Champ inconnu';
            return `${field}: ${d.msg}`;
          }).join(', ');
          setError(`Erreur de validation: ${messages}`);
        } else if (typeof details === 'string') {
          setError(details);
        } else {
          setError("Format de données invalide pour le serveur.");
        }
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de la création du besoin');
      }
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

        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Catalogue des pièces</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Inventory2 />}
                  onClick={() => setShowHorsCatalogueModal(true)}
                >
                  Pièce hors catalogue
                </Button>
              </Box>
              <TextField
                fullWidth
                placeholder="Rechercher par désignation..."
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
                      <TableCell>Désignation</TableCell>
                      <TableCell align="right">Prix</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPieces.map(piece => (
                      <TableRow key={piece.id_piece} hover>
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
                        <TableRow key={piece.temp_id || piece.id_piece}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {piece.designation}
                            </Typography>
                            {!piece.est_hors_catalogue && (
                              <Typography variant="caption" color="text.secondary">
                                {piece.reference}
                              </Typography>
                            )}
                            {piece.est_hors_catalogue && (
                              <Typography variant="caption" color="warning.main">
                                Hors catalogue
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantite(piece.id_piece || piece.temp_id, piece.quantite - 1)}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                              <Typography variant="body2" fontWeight={500}>
                                {piece.quantite}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantite(piece.id_piece || piece.temp_id, piece.quantite + 1)}
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
                              onClick={() => handleRemovePiece(piece.id_piece || piece.temp_id)}
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

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Récapitulatif</Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Désignation</TableCell>
                    <TableCell align="center">Quantité</TableCell>
                    <TableCell align="right">Prix unitaire</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPieces.map(piece => (
                    <TableRow key={piece.temp_id || piece.id_piece}>
                      <TableCell>
                        {piece.designation}
                        {piece.est_hors_catalogue && (
                          <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                            (Hors catalogue - sera créé)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{piece.quantite}</TableCell>
                      <TableCell align="right">{formatPrice(piece.prix_unitaire)}</TableCell>
                      <TableCell align="right">{formatPrice(piece.prix_total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

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
              </Grid>
            </Paper>

            <Alert severity="warning">
              Une fois créé, l'état des besoins sera soumis au circuit de validation (DG → Comptable → Caisse).
              {selectedPieces.some(p => p.est_hors_catalogue) && (
                <Box component="span" sx={{ display: 'block', mt: 1 }}>
                  ⚠️ Les pièces hors catalogue seront automatiquement créées dans le catalogue.
                </Box>
              )}
            </Alert>
          </Box>
        )}

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

      <Dialog open={showHorsCatalogueModal} onClose={() => setShowHorsCatalogueModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pièce hors catalogue</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Désignation"
              value={horsCatalogueData.designation}
              onChange={(e) => setHorsCatalogueData({ ...horsCatalogueData, designation: e.target.value })}
              placeholder="Ex: Pièce spéciale importée"
              required
            />
            <TextField
              fullWidth
              label="Prix unitaire (USD)"
              type="number"
              value={horsCatalogueData.prix}
              onChange={(e) => setHorsCatalogueData({ ...horsCatalogueData, prix: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
            <TextField
              fullWidth
              label="Quantité"
              type="number"
              value={horsCatalogueData.quantite}
              onChange={(e) => setHorsCatalogueData({ ...horsCatalogueData, quantite: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHorsCatalogueModal(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddHorsCatalogue}>Ajouter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NouveauBesoin;