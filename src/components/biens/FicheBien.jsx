// frontend/src/components/biens/FicheBien.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box, Paper, Typography, Grid, Chip, Divider, Button,
    IconButton, Tooltip, Alert, CircularProgress, Tabs, Tab,
    Card, CardContent, CardHeader, Avatar, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    ThemeProvider,
} from '@mui/material';
import { okapiMuiTheme } from '../../theme/muiTheme';
import { useTranslation, useTranslationOptional } from '../../context/LanguageContext';
import {
    ArrowBack, Edit, Delete, QrCode, History, Warning,
    CheckCircle, Build, AccountBalance, CalendarToday,
    LocationOn, AttachMoney, Info, PieChart, DirectionsCar,
    Print, Calculate, Visibility, Forum
} from '@mui/icons-material';
import { biensService } from '../../services/biens';
import { useAuth } from '../../hooks/useAuth';
import usePermissions from '../../hooks/usePermissions';
import useBienAccess from '../../hooks/useBienAccess';
import { formatDate, formatPrice } from '../../utils/formatters';
import { ETAT_BIEN_COLORS, TYPE_BIEN_LABELS } from '../../utils/constants';
import { normalizeStatusForSelect, resolveEtatApiKey } from '../../utils/statusNormalizer';
import { getEtatBienLabelI18n } from '../../utils/i18nWorkflow';
import QRCodeGenerator from '../common/QRCodeGenerator';
import ConfirmDialog from '../common/ConfirmDialog';
import ComposantsList from '../composants/ComposantsList';
import AnalyseComposantsPreview from '../composants/AnalyseComposantsPreview';
import HistoriqueMouvements from '../mouvements/HistoriqueMouvements';
import CalculAmortissement from '../amortissements/CalculAmortissement';
import CessionBien from '../cessions/CessionBien';
import RebutBien from '../cessions/RebutBien';
import DepreciationHistory from '../amortissements/DepreciationHistory';
import etatsService from '../../services/etats';
import CessionModal from '../cessions/CessionModal';
import ConcertationsTab from '../concertations/ConcertationsTab';
import api from '../../services/api';

const hasValidValue = (value) => {
    return value !== null && value !== undefined && value !== '' && value !== '-';
};

const CessionEligibilitySection = ({ bienId, onCessionClick }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [eligibilite, setEligibilite] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEligibilite = async () => {
            if (!bienId) return;
            try {
                setLoading(true);
                const response = await biensService.verifierEligibiliteCession(bienId);
                setEligibilite(response);
            } catch (err) {
                setError(err.response?.data?.detail || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEligibilite();
    }, [bienId]);

    if (loading) {
        return (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {t('common.loading')}
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 2 }}>
                <Alert severity="error" variant="outlined" size="small">
                    {error}
                </Alert>
            </Paper>
        );
    }

    if (!eligibilite) return null;

    const { est_eligible, motifs_ineligibilite, recommandation } = eligibilite;

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        {t('assets.cessionEligibility')}
                    </Typography>
                    {est_eligible ? (
                        <Chip
                            label={t('assets.eligible')}
                            color="success"
                            size="small"
                            icon={<CheckCircle fontSize="small" />}
                        />
                    ) : (
                        <Chip
                            label={t('assets.notEligible')}
                            color="error"
                            size="small"
                            icon={<Warning fontSize="small" />}
                        />
                    )}
                    {!est_eligible && motifs_ineligibilite && motifs_ineligibilite.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            {motifs_ineligibilite.map((motif, idx) => (
                                <Typography key={idx} variant="caption" display="block" color="text.secondary">
                                    • {motif}
                                </Typography>
                            ))}
                        </Box>
                    )}
                    {recommandation && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {recommandation}
                        </Typography>
                    )}
                </Box>
                {est_eligible && (
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={onCessionClick}
                    >
                        {t('assets.initiateCession')}
                    </Button>
                )}
            </Box>
        </Paper>
    );
};

const FicheBien = () => {
    const { t, lang } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const panneId = searchParams.get('panne_id');
    const { canCreateMouvementType, hasRole, user } = useAuth();
    const {
        canEditBien,
        canDeleteBien,
        canViewPurchasePrice,
        isTechnicianMode,
        isTechnicien,
    } = usePermissions();
    const { fetchBienForContext } = useBienAccess();

    const [bien, setBien] = useState(null);
    const [loading, setLoading] = useState(true);
    const [printing, setPrinting] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [qrDialogOpen, setQrDialogOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false });

    const [showAmortissementModal, setShowAmortissementModal] = useState(false);
    const [amortissementSuccess, setAmortissementSuccess] = useState(false);
    const [showCessionModal, setShowCessionModal] = useState(false);
    const [showRebutModal, setShowRebutModal] = useState(false);

    const [eligibilite, setEligibilite] = useState({
        cession: { eligible: false, raison: '' },
        rebut: { eligible: false, raison: '' }
    });
    const [loadingElig, setLoadingElig] = useState(false);

    // ✅ Vérifier si l'utilisateur est validateur (DG, COMPTABLE ou ADMIN)
    const userRoles = user?.roles || [];
    const isValidator = userRoles.some(role => ['DG', 'COMPTABLE', 'ADMIN'].includes(role));

    useEffect(() => {
        fetchBien();
    }, [id, panneId]);

    const fetchBien = async () => {
        try {
            setLoading(true);
            const result = await fetchBienForContext(id, {
                panneId: panneId || undefined,
            });
            if (result.data) {
                setBien(result.data);
                setError(null);
                // ✅ Ne charger l'éligibilité que si l'utilisateur est validateur
                if (isValidator) {
                    fetchEligibilite(result.data.id_bien);
                }
            } else if (result.denied) {
                setError(result.error || t('assets.accessDenied'));
                setBien(null);
            } else {
                setError(result.error || t('assets.loadError'));
                setBien(null);
            }
        } catch {
            setError(t('assets.loadError'));
            setBien(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibilite = async (bienId) => {
        if (!bienId) return;
        try {
            setLoadingElig(true);
            const cessionResponse = await api.get(`/concertations/bien/${bienId}/eligibilite/CESSION`);
            const rebutResponse = await api.get(`/concertations/bien/${bienId}/eligibilite/REBUT`);
            setEligibilite({
                cession: {
                    eligible: cessionResponse.data.eligible || false,
                    raison: cessionResponse.data.raison || ''
                },
                rebut: {
                    eligible: rebutResponse.data.eligible || false,
                    raison: rebutResponse.data.raison || ''
                }
            });
        } catch (err) {
            console.error('Erreur chargement éligibilité:', err);
        } finally {
            setLoadingElig(false);
        }
    };

    const handleEdit = () => navigate(`/biens/${id}/edit`);

    const handleDelete = async () => {
        try {
            await biensService.delete(id);
            navigate('/biens');
        } catch (err) {
            setError(t('assets.deleteError'));
        }
    };

    const handleTabChange = (_, newValue) => setActiveTab(newValue);

    const handlePrintFiche = async () => {
        if (!bien || !bien.id_bien) {
            setError(t('assets.printNoData'));
            return;
        }

        try {
            setPrinting(true);
            await etatsService.exportFicheBien(bien.id_bien);
        } catch (err) {
            console.error('Erreur lors de l\'impression:', err);
            setError(err.message || t('assets.printError'));
        } finally {
            setPrinting(false);
        }
    };

    const handleApercuFiche = () => {
        if (!bien?.id_bien) return;
        window.open(`/prints/fiche-bien/${bien.id_bien}`, '_blank', 'noopener,noreferrer');
    };

    const canCalculateAmortissement = () => {
        return hasRole('COMPTABLE') || hasRole('ADMIN') || hasRole('DG');
    };

    const handleOpenAmortissement = () => {
        setShowAmortissementModal(true);
    };

    const handleCloseAmortissement = () => {
        setShowAmortissementModal(false);
        if (amortissementSuccess) {
            setAmortissementSuccess(false);
            fetchBien();
        }
    };

    const handleAmortissementSuccess = () => {
        setAmortissementSuccess(true);
        setTimeout(() => {
            setShowAmortissementModal(false);
            setAmortissementSuccess(false);
        }, 1500);
    };

    const getEtatInfo = (etat) => {
        const apiKey = resolveEtatApiKey(etat);
        const selectValue = apiKey ? apiKey.toLowerCase() : normalizeStatusForSelect(etat);
        const label = getEtatBienLabelI18n(t, apiKey || etat);
        const color = ETAT_BIEN_COLORS[selectValue] || ETAT_BIEN_COLORS[String(etat).toLowerCase()] || '#9e9e9e';
        return { label, color };
    };

    const getTypeLabel = (type) => {
        const key = `status.type.${type}`;
        return t(key) !== key ? t(key) : (TYPE_BIEN_LABELS[type] || type);
    };

    const renderSpecificFields = () => {
        if (!bien?.type_bien) return null;

        if (bien.type_bien === 'vehicule') {
            const fields = [
                { label: t('assets.fieldVehicleType'), value: bien.type_vehicule, col: 6 },
                { label: t('assets.fieldBrand'), value: bien.marque, col: 6 },
                { label: t('assets.fieldModel'), value: bien.modele, col: 6 },
                { label: t('assets.fieldRegistration'), value: bien.immatriculation, col: 6, copy: true },
                { label: t('assets.fieldWeight'), value: bien.poids ? `${bien.poids} kg` : null, col: 4 },
                { label: t('assets.fieldDimensions'), value: bien.dimension, col: 4 },
                { label: t('assets.fieldFuel'), value: bien.type_de_carburant, col: 4 },
                { label: t('assets.fieldFuelConsumption'), value: bien.consommation_carburant ? `${bien.consommation_carburant} L/100km` : null, col: 6 },
                { label: t('assets.fieldOilConsumption'), value: bien.consommation_huile ? `${bien.consommation_huile} L/1000km` : null, col: 6 },
                { label: t('assets.fieldPropulsion'), value: bien.type_propulsion, col: 6 }
            ].filter(field => hasValidValue(field.value));

            if (fields.length === 0) return null;

            return (
                <Grid container spacing={2}>
                    {fields.map((field, idx) => (
                        <Grid item xs={12} md={field.col || 6} key={idx}>
                            <InfoField label={field.label} value={field.value} copy={field.copy} copyLabel={t('assets.copy')} />
                        </Grid>
                    ))}
                </Grid>
            );
        }

        if (bien.type_bien === 'machine') {
            const fields = [
                { label: t('assets.fieldManufacturer'), value: bien.fabricant, col: 6 },
                { label: t('assets.fieldModel'), value: bien.modele, col: 6 },
                { label: t('assets.fieldSerialNumber'), value: bien.numero_serie, col: 6, copy: true },
                { label: t('assets.fieldPower'), value: bien.puissance ? `${bien.puissance} kW` : null, col: 6 },
                { label: t('assets.fieldPowerSupply'), value: bien.type_alimentation, col: 6 },
                { label: t('assets.fieldVoltage'), value: bien.tension_normal, col: 6 },
                { label: t('assets.fieldAssignedService'), value: bien.service_affecte, col: 6 },
                { label: t('assets.fieldResponsible'), value: bien.responsable, col: 6 },
                { label: t('assets.fieldElecConsumption'), value: bien.consommation_elec ? `${bien.consommation_elec} kWh` : null, col: 6 },
                { label: t('assets.fieldMaintenanceFreq'), value: bien.frequence_maintenance, col: 6 }
            ].filter(field => hasValidValue(field.value));

            if (fields.length === 0) return null;

            return (
                <Grid container spacing={2}>
                    {fields.map((field, idx) => (
                        <Grid item xs={12} md={field.col || 6} key={idx}>
                            <InfoField label={field.label} value={field.value} copy={field.copy} copyLabel={t('assets.copy')} />
                        </Grid>
                    ))}
                </Grid>
            );
        }

        if (bien.type_bien === 'ordinateur') {
            const fields = [
                { label: t('assets.fieldBrand'), value: bien.marque, col: 6 },
                { label: t('assets.fieldModel'), value: bien.modele, col: 6 },
                { label: t('assets.fieldProcessor'), value: bien.processeur, col: 6 },
                { label: t('assets.fieldRam'), value: bien.ram, col: 6 },
                { label: t('assets.fieldStorage'), value: bien.stockage, col: 6 },
                { label: t('assets.fieldIpAddress'), value: bien.adresse_ip, col: 6, copy: true },
                { label: t('assets.fieldAssignedUser'), value: bien.utilisateur_affecte, col: 12 }
            ].filter(field => hasValidValue(field.value));

            if (fields.length === 0) return null;

            return (
                <Grid container spacing={2}>
                    {fields.map((field, idx) => (
                        <Grid item xs={12} md={field.col || 6} key={idx}>
                            <InfoField label={field.label} value={field.value} copy={field.copy} copyLabel={t('assets.copy')} />
                        </Grid>
                    ))}
                </Grid>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !bien) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={() => navigate('/biens')}>
                        {t('common.back')}
                    </Button>
                }>
                    {error || t('assets.notFound')}
                </Alert>
            </Box>
        );
    }

    const etatInfo = getEtatInfo(bien.etat);
    const ageAns = bien.date_acquisition ?
        new Date().getFullYear() - new Date(bien.date_acquisition).getFullYear() : null;

    return (
        <ThemeProvider theme={okapiMuiTheme}>
            <Box sx={{ p: 3 }}>
                <Dialog
                    open={showAmortissementModal}
                    onClose={handleCloseAmortissement}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        {t('assets.calculateDepreciationTitle', {
                            name: bien.nom_bien || bien.designation || (bien.marque || bien.fabricant ? `${bien.marque || bien.fabricant} ${bien.modele || ''}`.trim() : `${bien.type_bien || ''} #${bien.id_bien}`),
                        })}
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        <CalculAmortissement
                            bienId={parseInt(id)}
                            onSuccess={handleAmortissementSuccess}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseAmortissement} color="inherit">
                            {t('assets.close')}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyItems: 'space-between', gap: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                        <IconButton onClick={() => navigate('/biens')} size="small">
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {getTypeLabel(bien.type_bien)} • {bien.marque || bien.fabricant} {bien.modele}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('assets.qrCodeLabel', { code: bien.qr_code })}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                        {canCalculateAmortissement() && (
                            <Tooltip title={t('assets.calculateDepreciation')}>
                                <IconButton
                                    onClick={handleOpenAmortissement}
                                    color="primary"
                                >
                                    <Calculate />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={t('assets.qrCode')}>
                            <IconButton onClick={() => setQrDialogOpen(true)} color="primary">
                                <QrCode />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('assets.previewBeforePrint')}>
                            <IconButton onClick={handleApercuFiche} color="primary">
                                <Visibility />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('assets.downloadPdf')}>
                            <IconButton
                                onClick={handlePrintFiche}
                                color="success"
                                disabled={printing}
                            >
                                {printing ? <CircularProgress size={24} /> : <Print />}
                            </IconButton>
                        </Tooltip>
                        {canEditBien && (
                            <Tooltip title={t('common.edit')}>
                                <IconButton onClick={handleEdit} color="info">
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDeleteBien && (
                            <Tooltip title={t('common.delete')}>
                                <IconButton onClick={() => setConfirmDelete({ open: true })} color="error">
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {isTechnicianMode && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <strong>{t('assets.technicianModeTitle')}</strong> — {t('assets.technicianModeInfo')}
                    </Alert>
                )}

                {(bien.etat === 'PANNE' || bien.etat === 'MAINTENANCE') && (
                    <Alert
                        severity={bien.etat === 'PANNE' ? 'error' : 'warning'}
                        icon={bien.etat === 'PANNE' ? <Warning /> : <Build />}
                        sx={{ mb: 3 }}
                    >
                        <strong>{bien.etat === 'PANNE' ? t('assets.statusPanne') : t('assets.statusMaintenance')}</strong>
                        {bien.etat === 'PANNE'
                            ? t('assets.statusPanneDesc')
                            : t('assets.statusMaintenanceDesc')}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3 }}>
                            <Tabs key={lang} value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
                                <Tab label={t('assets.tabInfo')} />
                                <Tab label={t('assets.tabHistory')} />
                                <Tab label={t('assets.tabDocuments')} />
                                <Tab label={t('assets.tabComponents')} icon={<PieChart fontSize="small" />} iconPosition="start" />
                                <Tab label={t('assets.tabDepreciations')} icon={<AccountBalance fontSize="small" />} iconPosition="start" />
                                <Tab label={t('assets.tabMovements')} icon={<DirectionsCar fontSize="small" />} iconPosition="start" />
                                {isValidator && (
                                    <Tab label={t('assets.tabConcertations')} icon={<Forum fontSize="small" />} iconPosition="start" />
                                )}
                            </Tabs>

                            {activeTab === 0 && (
                                <Box>
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardHeader
                                            title={t('assets.technicalSheet')}
                                            avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Info fontSize="small" /></Avatar>}
                                        />
                                        <CardContent>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={4}>
                                                    <InfoField label={t('assets.fieldType')} value={getTypeLabel(bien.type_bien)} />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <InfoField label={t('assets.fieldState')} value={
                                                        <Chip
                                                            label={etatInfo.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: `${etatInfo.color}20`,
                                                                color: etatInfo.color,
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                    } />
                                                </Grid>
                                                {hasValidValue(ageAns) && (
                                                    <Grid item xs={12} md={4}>
                                                        <InfoField label={t('assets.fieldAge')} value={t('assets.fieldAgeValue', { count: ageAns })} />
                                                    </Grid>
                                                )}
                                                {canViewPurchasePrice && hasValidValue(bien.date_acquisition) && (
                                                    <Grid item xs={12} md={6}>
                                                        <InfoField
                                                            label={t('assets.fieldAcquisitionDate')}
                                                            value={formatDate(bien.date_acquisition, 'fr', lang)}
                                                            icon={<CalendarToday fontSize="small" />}
                                                        />
                                                    </Grid>
                                                )}
                                                {canViewPurchasePrice && hasValidValue(bien.prix_acquisition) && (
                                                    <Grid item xs={12} md={6}>
                                                        <InfoField
                                                            label={t('assets.fieldAcquisitionPrice')}
                                                            value={formatPrice(bien.prix_acquisition)}
                                                            icon={<AttachMoney fontSize="small" />}
                                                        />
                                                    </Grid>
                                                )}
                                                {hasValidValue(bien.localisation) && (
                                                    <Grid item xs={12}>
                                                        <InfoField
                                                            label={t('assets.fieldLocation')}
                                                            value={typeof bien.localisation === 'object' && bien.localisation !== null
                                                                ? bien.localisation.nom_localisation
                                                                : bien.localisation}
                                                            icon={<LocationOn fontSize="small" />}
                                                        />
                                                    </Grid>
                                                )}
                                                {hasValidValue(bien.description) && (
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                            {t('assets.fieldDescription')}
                                                        </Typography>
                                                        <Typography variant="body2">{bien.description}</Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </CardContent>
                                    </Card>

                                    {renderSpecificFields() && (
                                        <Card variant="outlined">
                                            <CardHeader
                                                title={t('assets.characteristics', { type: getTypeLabel(bien.type_bien) })}
                                                avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Build fontSize="small" /></Avatar>}
                                            />
                                            <CardContent>
                                                {renderSpecificFields()}
                                            </CardContent>
                                        </Card>
                                    )}
                                </Box>
                            )}

                            {activeTab === 1 && (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                    <History sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                                    <Typography>{t('assets.historyPlaceholder')}</Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {t('assets.historyPhase')}
                                    </Typography>
                                </Box>
                            )}

                            {activeTab === 2 && (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                    <Info sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                                    <Typography>{t('assets.documentsPlaceholder')}</Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {t('assets.documentsPhase')}
                                    </Typography>
                                </Box>
                            )}

                            {activeTab === 3 && (
                                <Box sx={{ p: 2 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 3,
                                            bgcolor: '#e8f5e9',
                                            borderColor: '#2e7d32',
                                            borderLeft: 4,
                                            borderLeftColor: '#2e7d32'
                                        }}
                                    >
                                        <Typography variant="h6" color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Build color="primary" />
                                            {t('assets.componentsTitle')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('assets.componentsDesc')}
                                        </Typography>
                                    </Paper>
                                    {bien && <AnalyseComposantsPreview bienId={bien.id_bien} />}
                                    <ComposantsList
                                        bienId={bien.id_bien}
                                        readOnly={!canEditBien}
                                        onRefresh={fetchBien}
                                    />
                                </Box>
                            )}

                            {activeTab === 4 && (
                                <Box sx={{ p: 2 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 3,
                                            bgcolor: '#fff8e1',
                                            borderColor: '#f9a825',
                                            borderLeft: 4,
                                            borderLeftColor: '#f9a825'
                                        }}
                                    >
                                        <Typography variant="h6" color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccountBalance color="primary" />
                                            {t('assets.depreciationsTitle')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('assets.depreciationsDesc')}
                                        </Typography>
                                    </Paper>
                                    {bien && (
                                        <DepreciationHistory
                                            bienId={bien.id_bien}
                                            onRefresh={fetchBien}
                                        />
                                    )}
                                </Box>
                            )}

                            {activeTab === 5 && (
                                <Box sx={{ p: 2 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 3,
                                            bgcolor: 'grey.50',
                                            borderColor: 'primary.main',
                                            borderLeft: 4,
                                            borderLeftColor: 'primary.main'
                                        }}
                                    >
                                        <Typography variant="h6" color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DirectionsCar color="primary" />
                                            {t('assets.movementsTitle')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('assets.movementsDesc')}
                                        </Typography>
                                    </Paper>
                                    <HistoriqueMouvements
                                        bienId={bien.id_bien}
                                        readOnly={!canCreateMouvementType('TRANSFERT')}
                                    />
                                </Box>
                            )}

                            {activeTab === 6 && isValidator && (
                                <ConcertationsTab
                                    bienId={bien.id_bien}
                                    onEligibilityChange={fetchEligibilite}
                                />
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                            <Typography variant="h6" gutterBottom>{t('assets.qrCode')}</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box
                                sx={{
                                    bgcolor: 'grey.100',
                                    p: 2,
                                    borderRadius: 2,
                                    display: 'inline-block',
                                    mb: 2
                                }}
                            >
                                <Typography variant="body2" fontFamily="monospace">
                                    {bien.qr_code}
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<QrCode />}
                                onClick={() => setQrDialogOpen(true)}
                                fullWidth
                            >
                                {t('assets.viewDownload')}
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                {t('assets.scanHint')}
                            </Typography>
                        </Paper>

                        {/* ✅ Section éligibilité cession visible seulement pour les validateurs */}
                        {isValidator && (
                            <Box sx={{ mb: 3 }}>
                                <CessionEligibilitySection
                                    bienId={bien.id_bien}
                                    onCessionClick={() => setShowCessionModal(true)}
                                />
                            </Box>
                        )}

                        {canViewPurchasePrice && (
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    <AccountBalance sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'small' }} />
                                    {t('assets.bookValue')}
                                </Typography>
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="h4" color="primary">
                                        {formatPrice(bien.prix_acquisition)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t('assets.acquisitionValue')}
                                    </Typography>
                                </Box>
                                {hasValidValue(ageAns) && (
                                    <>
                                        <LinearProgress variant="determinate" value={Math.min(ageAns * 10, 100)} sx={{ mb: 1 }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {t('assets.estimatedDepreciation')}
                                        </Typography>
                                    </>
                                )}
                            </Paper>
                        )}

                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>{t('assets.quickActions')}</Typography>
                            <Grid container spacing={1}>
                                {isTechnicien && (
                                    <>
                                        <Grid item xs={6}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                startIcon={<Build />}
                                                onClick={() => navigate(`/pannes/declarer?bien_id=${bien.id_bien}`)}
                                            >
                                                {t('assets.declareBreakdown')}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                startIcon={<CheckCircle />}
                                                onClick={() => navigate(`/maintenances/planning?bien_id=${bien.id_bien}`)}
                                            >
                                                {t('assets.planMaintenance')}
                                            </Button>
                                        </Grid>
                                    </>
                                )}
                                <Grid item xs={12} sx={{ mt: 1 }}>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        fullWidth
                                        startIcon={<DirectionsCar />}
                                        onClick={() => navigate(`/mouvements/nouveau?bien_id=${bien.id_bien}`)}
                                        disabled={!canCreateMouvementType('TRANSFERT')}
                                    >
                                        {t('assets.newMovement')}
                                    </Button>
                                </Grid>
                                {canCalculateAmortissement() && (
                                    <Grid item xs={12} sx={{ mt: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            startIcon={<Calculate />}
                                            onClick={handleOpenAmortissement}
                                        >
                                            {t('assets.calculateDepreciation')}
                                        </Button>
                                    </Grid>
                                )}
                                {/* ✅ Boutons de cession/rebut visibles seulement pour les validateurs */}
                                {isValidator && canCalculateAmortissement() && bien.statut_comptable !== 'CEDE' && bien.statut_comptable !== 'MIS_AU_REBUT' && (
                                    <>
                                        <Grid item xs={6} sx={{ mt: 1 }}>
                                            <Tooltip title={loadingElig ? t('common.loading') : (eligibilite.cession?.eligible ? '' : (eligibilite.cession?.raison || t('assets.cessionNotAllowed')))}>
                                                <span>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        fullWidth
                                                        color="success"
                                                        onClick={() => setShowCessionModal(true)}
                                                        disabled={!eligibilite.cession?.eligible || loadingElig}
                                                    >
                                                        {t('assets.disposeAsset')}
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </Grid>
                                        <Grid item xs={6} sx={{ mt: 1 }}>
                                            <Tooltip title={loadingElig ? t('common.loading') : (eligibilite.rebut?.eligible ? '' : (eligibilite.rebut?.raison || t('assets.rebutNotAllowed')))}>
                                                <span>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        fullWidth
                                                        color="error"
                                                        onClick={() => setShowRebutModal(true)}
                                                        disabled={!eligibilite.rebut?.eligible || loadingElig}
                                                    >
                                                        {t('assets.scrapAsset')}
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                <QRCodeGenerator
                    bienId={bien.id_bien}
                    qrCode={bien.qr_code}
                    open={qrDialogOpen}
                    onClose={() => setQrDialogOpen(false)}
                />

                <ConfirmDialog
                    open={confirmDelete.open}
                    title={t('assets.deleteTitle')}
                    content={t('assets.deleteContent', {
                        name: `${bien.marque || bien.fabricant} ${bien.modele}`,
                    })}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete({ open: false })}
                />

                <Dialog open={showCessionModal} onClose={() => setShowCessionModal(false)} maxWidth="md" fullWidth>
                    <DialogTitle>{t('assets.cessionTitle')}</DialogTitle>
                    <DialogContent>
                        <CessionBien
                            embedded
                            bienId={String(bien.id_bien)}
                            onClose={(ok) => {
                                setShowCessionModal(false);
                                if (ok) fetchBien();
                            }}
                        />
                    </DialogContent>
                </Dialog>

                <CessionModal
                    isOpen={showCessionModal}
                    onClose={() => setShowCessionModal(false)}
                    bien={bien}
                    onSuccess={() => {
                        setShowCessionModal(false);
                        fetchBien();
                    }}
                />

                <Dialog open={showRebutModal} onClose={() => setShowRebutModal(false)} maxWidth="md" fullWidth>
                    <DialogTitle>{t('assets.scrapTitle')}</DialogTitle>
                    <DialogContent>
                        <RebutBien
                            embedded
                            bienId={String(bien.id_bien)}
                            onClose={(ok) => {
                                setShowRebutModal(false);
                                if (ok) fetchBien();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};

const InfoField = ({ label, value, icon, copy = false, copyLabel }) => {
    const langCtx = useTranslationOptional();
    const resolvedCopyLabel = copyLabel ?? langCtx?.t('assets.copy') ?? 'Copier';
    if (!hasValidValue(value)) {
        return null;
    }

    const handleCopy = async () => {
        if (copy && typeof value === 'string') {
            await navigator.clipboard.writeText(value);
        }
    };

    if (React.isValidElement(value)) {
        return (
            <Box>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    component="span"
                >
                    {icon}
                    {label}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                    {value}
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Typography
                variant="caption"
                color="text.secondary"
                display="flex"
                alignItems="center"
                gap={0.5}
                component="span"
            >
                {icon}
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                    component="span"
                    variant="body1"
                    fontWeight={500}
                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                >
                    {value}
                </Typography>
                {copy && typeof value === 'string' && value && (
                    <Tooltip title={resolvedCopyLabel}>
                        <IconButton size="small" onClick={handleCopy} sx={{ p: 0.5 }}>
                            <Info fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
};

export default FicheBien;