// frontend/src/components/biens/QRCodeView.jsx
import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Box, Paper, Typography, Button, Grid, Card, CardContent, Divider } from '@mui/material';
import { QrCode, Download, Print, History } from '@mui/icons-material';
import QRCodeGenerator from '../common/QRCodeGenerator';
import { formatDate } from '../../utils/formatters';

const QRCodeView = ({ bien }) => {
  const { t } = useTranslation();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  if (!bien) {
    return <Typography>Aucun bien sélectionné</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          <QrCode sx={{ mr: 1, verticalAlign: 'middle' }} />
          QR Code
        </Typography>
        <Button
          variant="contained"
          startIcon={<QrCode />}
          onClick={() => setQrDialogOpen(true)}
        >
          Voir / Télécharger
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Carte QR Code */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              QR Code du Bien
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box 
              sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 2,
                display: 'inline-block'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {bien.qr_code}
              </Typography>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Download />}
                onClick={() => setQrDialogOpen(true)}
              >
                Télécharger
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Print />}
                onClick={() => setQrDialogOpen(true)}
              >
                Imprimer
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Informations du bien */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations associées
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body1">{bien.type_bien}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Marque</Typography>
                  <Typography variant="body1">{bien.marque || bien.fabricant || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Modèle</Typography>
                  <Typography variant="body1">{bien.modele || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Acquisition</Typography>
                  <Typography variant="body1">{formatDate(bien.date_acquisition)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Localisation</Typography>
                  <Typography variant="body1">{bien.localisation || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">État</Typography>
                  <Typography variant="body1">{bien.etat}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Historique */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              <History sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'small' }} />
              Utilisation du QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Le QR code permet de :
            </Typography>
            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
              <li><Typography variant="body2">Accéder rapidement à la fiche du bien</Typography></li>
              <li><Typography variant="body2">Vérifier l'authenticité et la traçabilité</Typography></li>
              <li><Typography variant="body2">Faciliter l'inventaire physique</Typography></li>
              <li><Typography variant="body2">Déclarer une panne rapidement</Typography></li>
            </ul>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog QR Code */}
      <QRCodeGenerator
        bienId={bien.id_bien}
        qrCode={bien.qr_code}
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
      />
    </Box>
  );
};

export default QRCodeView;