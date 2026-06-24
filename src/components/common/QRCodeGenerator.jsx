// frontend/src/components/common/QRCodeGenerator.jsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, IconButton } from '@mui/material';
import { Download, Close, Print } from '@mui/icons-material';
import qrcodeService from '../../services/qrcode';
import { useTranslation } from '../../context/LanguageContext';

const isValidImageData = (data) =>
  data &&
  typeof data === 'string' &&
  (data.startsWith('data:image/png;base64,') ||
    data.startsWith('data:image/jpeg;base64,') ||
    data.startsWith('data:image/webp;base64,'));

const QRCodeGenerator = ({ bienId, qrCode, open, onClose }) => {
  const { t } = useTranslation();
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && bienId) {
      fetchQRCode();
    }
  }, [open, bienId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await qrcodeService.getView(bienId);
      const imageData = response.data.image_base64;
      if (isValidImageData(imageData)) {
        setQrImage(imageData);
      } else {
        setQrImage(null);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erreur chargement QR code:', error);
      }
      setQrImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await qrcodeService.download(bienId);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR-${qrCode || bienId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erreur téléchargement QR code:', error);
      }
    }
  };

  const handlePrint = () => {
    if (!isValidImageData(qrImage)) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('common.qrGenerator.printTitle', { code: qrCode })}</title>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container { text-align: center; }
            img { max-width: 300px; }
            .info { margin-top: 20px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${qrImage}" alt="${t('common.qrGenerator.printAlt')}" />
            <div class="info">
              <p><strong>${t('common.qrGenerator.printLabel')}</strong> ${qrCode}</p>
              <p>${t('common.qrGenerator.printScanHint')}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('common.qrGenerator.dialogTitle')}</Typography>
          <IconButton onClick={onClose} size="small" aria-label={t('common.qrGenerator.closeAria')}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        {loading ? (
          <Typography role="status">{t('common.qrGenerator.loading')}</Typography>
        ) : isValidImageData(qrImage) ? (
          <Box>
            <img
              src={qrImage}
              alt={t('common.qrGenerator.imageAlt')}
              loading="lazy"
              style={{
                maxWidth: '250px',
                width: '100%',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                padding: '10px',
              }}
            />
            {qrCode && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {qrCode}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography color="error">{t('common.qrGenerator.errorGeneration')}</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.qrGenerator.close')}
        </Button>
        <Button
          onClick={handlePrint}
          variant="outlined"
          startIcon={<Print />}
          disabled={!isValidImageData(qrImage)}
        >
          {t('print')}
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={<Download />}
          disabled={!isValidImageData(qrImage)}
        >
          {t('common.qrGenerator.download')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeGenerator;
