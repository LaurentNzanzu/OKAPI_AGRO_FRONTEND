import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Button, Chip, CircularProgress, Alert, TextField, InputAdornment
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { History, Search, Visibility, CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { okapiMuiTheme, okapiMuiDarkTheme } from '../../theme/muiTheme';
import { useTheme } from '../../context/ThemeContext';
import { besoinsService } from '../../services/besoins';
import { formatDate, formatPrice } from '../../utils/formatters';
import api from '../../services/api';

const HistoriqueValidations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const muiTheme = theme === 'dark' ? okapiMuiDarkTheme : okapiMuiTheme;
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistorique();
  }, []);

  const fetchHistorique = async () => {
    try {
      setLoading(true);

      // Récupérer tous les besoins
      const besoins = await besoinsService.getAll();

      if (besoins && besoins.length > 0) {
        // Récupérer tous les IDs des biens uniques
        const bienIds = [...new Set(besoins.map(b => b.id_bien).filter(id => id))];

        // Récupérer tous les biens en une seule requête
        let biensMap = {};
        if (bienIds.length > 0) {
          const biensResponse = await api.get('/biens', {
            params: { ids: bienIds.join(',') }
          });
          biensMap = biensResponse.data.reduce((acc, bien) => {
            const marque = bien.marque || bien.fabricant || '';
            const modele = bien.modele || '';
            const designation = `${marque} ${modele}`.trim() || `Bien #${bien.id_bien}`;
            acc[bien.id_bien] = designation;
            return acc;
          }, {});
        }

        // Enrichir les données
        const enrichedData = besoins.map(item => ({
          ...item,
          bien_designation: biensMap[item.id_bien] || `Bien #${item.id_bien}`
        }));

        setHistorique(enrichedData);
      } else {
        setHistorique([]);
      }
    } catch (err) {
      setError('Impossible de charger l\'historique des validations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (statut) => {
    switch (statut) {
      case 'APPROUVEE':
        return <Chip icon={<CheckCircle />} label="Approuvée" color="success" size="small" />;
      case 'REJETE':
        return <Chip icon={<Cancel />} label="Rejetée" color="error" size="small" />;
      default:
        return <Chip icon={<HourglassEmpty />} label={statut} color="warning" size="small" />;
    }
  };

  // Filtrage côté frontend
  const filteredHistorique = historique.filter(item =>
    item.numero_demande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bien_designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id_bien?.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <Box className="app-page">
        {/* En-tête */}
        <Box className="app-page-header">
          <Box>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History color="primary" /> Historique des validations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Suivi de toutes les demandes et décisions de validation
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/validations')}
            startIcon={<Visibility />}
          >
            Voir les validations en attente
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Filtre */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par numéro de demande, désignation du bien ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Paper>

        {/* Tableau */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>N° Demande</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Bien / Panne</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistorique.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Aucun historique trouvé</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistorique.map((item) => (
                  <TableRow key={item.id_besoin} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.numero_demande || `Besoin #${item.id_besoin}`}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(item.date_creation)}</TableCell>
                    <TableCell>
                      {/* ✅ Affichage de la désignation du bien */}
                      <Typography variant="body2">
                        {item.bien_designation || `Bien #${item.id_bien}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Panne #{item.id_panne || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {formatPrice(item.montant_total)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(item.statut)}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/validations/${item.id_besoin}`)}
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ThemeProvider>
  );
};

export default HistoriqueValidations;