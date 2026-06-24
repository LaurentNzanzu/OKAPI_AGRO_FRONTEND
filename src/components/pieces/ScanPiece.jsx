// frontend/src/components/pieces/ScanPiece.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';
import { piecesService } from '../../services/pieces';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Stack,
    Paper
} from '@mui/material';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
    QrCodeScanner as QrCodeScannerIcon,
    Replay as ReplayIcon,
    AddShoppingCart as AddShoppingCartIcon,
    Keyboard as KeyboardIcon,
    PhotoCamera as PhotoCameraIcon,
    Stop as StopIcon
} from '@mui/icons-material';

const ScanPiece = () => {
  const { t } = useTranslation();
    const navigate = useNavigate();
    const scannerId = 'qr-scanner-' + Date.now();
    const [mode, setMode] = useState(null);
    const [resultat, setResultat] = useState(null);
    const [error, setError] = useState(null);
    const [manuelRecherche, setManuelRecherche] = useState('');
    const [loading, setLoading] = useState(false);
    const [quantite, setQuantite] = useState(1);

    const { startScanning, stopScanning, isScanning, error: cameraError } = useCamera();

    const handleModeChange = (event, newMode) => {
        if (mode === 'scan' && isScanning) {
            stopScanning();
        }
        setMode(newMode);
        setResultat(null);
        setError(null);
        setManuelRecherche('');
        setQuantite(1);
    };

    const handleScanSuccess = async (decodedText) => {
        if (import.meta.env.DEV) {
            console.debug('Code scanné (dev only)');
        }
        stopScanning();
        await rechercherPieceParScan(decodedText);
    };

    const handleScanFailure = (errorMessage) => {
        // Ignorer les erreurs normales
        if (!errorMessage || errorMessage.includes("NotFoundException")) {
            return;
        }
        console.warn("⚠️ Erreur scan:", errorMessage);
    };

    const rechercherPieceParScan = async (numeroSerie) => {
        if (!numeroSerie) return;
        setLoading(true);
        setError(null);
        try {
            const data = await piecesService.rechercherParNumeroSerie(numeroSerie);
            setResultat(data);
        } catch (err) {
            console.error("Erreur recherche par scan:", err);
            let message = "Erreur lors de la recherche";
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    message = detail;
                } else if (Array.isArray(detail)) {
                    message = detail.map(d => d.msg || d.message).join(', ');
                }
            }
            setError(message);
            setResultat(null);
        } finally {
            setLoading(false);
        }
    };

    const rechercherPieceManuelle = async () => {
        if (!manuelRecherche.trim()) {
            setError("Veuillez saisir une désignation");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await piecesService.rechercherParDesignation(manuelRecherche.trim());
            setResultat(data);
        } catch (err) {
            console.error("Erreur recherche manuelle:", err);
            let message = "Erreur lors de la recherche";
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    message = detail;
                } else if (Array.isArray(detail)) {
                    message = detail.map(d => d.msg || d.message).join(', ');
                }
            }
            setError(message);
            setResultat(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAjouterAuBesoin = () => {
        if (!resultat) return;
        navigate(`/besoins/nouveau?piece_id=${resultat.id_piece}&quantite=${quantite}`);
    };

    const handleReset = () => {
        if (mode === 'scan' && isScanning) {
            stopScanning();
        }
        setResultat(null);
        setError(null);
        setManuelRecherche('');
        setQuantite(1);
    };

    const demarrerScan = () => {
        const element = document.getElementById(scannerId);
        if (element) {
            startScanning(scannerId, handleScanSuccess, handleScanFailure);
        }
    };

    useEffect(() => {
        if (mode === 'scan') {
            setTimeout(demarrerScan, 500);
        }
        return () => {
            if (mode === 'scan' && isScanning) {
                stopScanning();
            }
        };
    }, [mode]);

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MagnifyingGlassIcon style={{ width: 28, height: 28 }} />
                Scanner ou Rechercher une pièce
            </Typography>

            <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                aria-label="mode de recherche"
                sx={{ mb: 3 }}
            >
                <ToggleButton value="scan" aria-label="scan">
                    <PhotoCameraIcon sx={{ mr: 1 }} /> Scanner
                </ToggleButton>
                <ToggleButton value="manuel" aria-label="manuel">
                    <KeyboardIcon sx={{ mr: 1 }} /> Recherche manuelle
                </ToggleButton>
            </ToggleButtonGroup>

            {mode === 'scan' && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    {cameraError && <Alert severity="error" sx={{ mb: 2 }}>{cameraError}</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    
                    {!resultat && (
                        <>
                            <Box id={scannerId} sx={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
                            {isScanning && (
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <CircularProgress size={24} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Scannez un code-barres ou QR Code
                                    </Typography>
                                </Box>
                            )}
                            {!isScanning && !resultat && (
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<ReplayIcon />}
                                        onClick={demarrerScan}
                                    >
                                        Démarrer le scan
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Paper>
            )}

            {mode === 'manuel' && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            label="Désignation de la pièce"
                            value={manuelRecherche}
                            onChange={(e) => setManuelRecherche(e.target.value)}
                            fullWidth
                            size="small"
                            disabled={loading}
                            onKeyPress={(e) => e.key === 'Enter' && rechercherPieceManuelle()}
                        />
                        <Button
                            variant="contained"
                            onClick={rechercherPieceManuelle}
                            disabled={loading || !manuelRecherche.trim()}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Rechercher'}
                        </Button>
                    </Stack>
                </Paper>
            )}

            {resultat && (
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Card>
                        <CardHeader
                            title="Pièce trouvée"
                            avatar={<QrCodeScannerIcon color="primary" />}
                        />
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Numéro de série</Typography>
                            <Typography variant="body1" fontWeight={500}>{resultat.numero_serie || 'Non défini'}</Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Désignation</Typography>
                            <Typography variant="body1">{resultat.designation}</Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Compatibilité</Typography>
                            <Typography variant="body1">{resultat.compatible_display || resultat.compatible_avec}</Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Prix d'achat</Typography>
                            <Typography variant="body1">{resultat.prix_achat.toLocaleString()} USD</Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Stock</Typography>
                            <Typography variant="body1" color={resultat.stock_actuel < resultat.stock_minimum ? 'error' : 'inherit'}>
                                {resultat.stock_actuel} / {resultat.stock_minimum} (minimum)
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                                <TextField
                                    label="Quantité"
                                    type="number"
                                    value={quantite}
                                    onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                                    size="small"
                                    inputProps={{ min: 1 }}
                                    sx={{ width: '100px' }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddShoppingCartIcon />}
                                    onClick={handleAjouterAuBesoin}
                                >
                                    Ajouter au besoin
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<StopIcon />}
                                    onClick={handleReset}
                                >
                                    Nouvelle recherche
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Paper>
            )}
        </Box>
    );
};

export default ScanPiece;