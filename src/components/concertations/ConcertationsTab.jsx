// frontend/src/components/concertations/ConcertationsTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, Grid, Chip, Divider, Button,
    IconButton, Tooltip, Alert, CircularProgress, TextField,
    Avatar, Stack, Badge
} from '@mui/material';
import {
    Send, CheckCircle, Cancel, Schedule, Person,
    Edit, Reply, Close, ChatBubbleOutline
} from '@mui/icons-material';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import api from '../../services/api';

const ConcertationsTab = ({ bienId, onEligibilityChange }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [discussions, setDiscussions] = useState([]);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const userRoles = user?.roles || [];
    const userRole = userRoles.length > 0 ? userRoles[0] : '';
    const isValidator = userRoles.some(role => ['DG', 'COMPTABLE'].includes(role));

    useEffect(() => {
        fetchDiscussions();
    }, [bienId]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedDiscussion?.messages]);

    const fetchDiscussions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/concertations/bien/${bienId}`);
            setDiscussions(response.data || []);
            if (response.data?.length > 0) {
                setSelectedDiscussion(response.data[0]);
            }
        } catch (err) {
            console.error('Erreur chargement discussions:', err);
            setError(err.response?.data?.detail || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscussion = async (id) => {
        try {
            const response = await api.get(`/concertations/${id}`);
            setSelectedDiscussion(response.data);
            setDiscussions(prev => prev.map(d => d.id === id ? response.data : d));
        } catch (err) {
            console.error('Erreur chargement discussion:', err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedDiscussion) return;

        try {
            setSending(true);
            const payload = {
                contenu: newMessage.trim(),
                parent_id: replyTo?.id || null
            };
            await api.post(`/concertations/${selectedDiscussion.id}/messages`, payload);
            await fetchDiscussion(selectedDiscussion.id);
            setNewMessage('');
            setReplyTo(null);
        } catch (err) {
            console.error('Erreur envoi message:', err);
            setError(err.response?.data?.detail || 'Erreur d\'envoi');
        } finally {
            setSending(false);
        }
    };

    const handleValidation = async (decision) => {
        if (!selectedDiscussion) return;

        try {
            setSending(true);
            const payload = {
                decision: decision,
                commentaire: `Validation ${decision} effectuée le ${new Date().toLocaleDateString()}`
            };
            await api.post(`/concertations/${selectedDiscussion.id}/valider`, payload);
            await fetchDiscussion(selectedDiscussion.id);
            if (onEligibilityChange) {
                onEligibilityChange();
            }
        } catch (err) {
            console.error('Erreur validation:', err);
            setError(err.response?.data?.detail || 'Erreur de validation');
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getValidationStatus = (discussion) => {
        const dgApproved = discussion.validations?.some(
            v => v.role_validateur === 'DG' && v.decision === 'APPROUVE'
        );
        const comptableApproved = discussion.validations?.some(
            v => v.role_validateur === 'COMPTABLE' && v.decision === 'APPROUVE'
        );
        const isRejected = discussion.validations?.some(
            v => v.decision === 'REJETE'
        );

        if (isRejected) return { status: 'REJETÉ', color: 'error', label: '❌ Rejeté' };
        if (dgApproved && comptableApproved) return { status: 'APPROUVÉ', color: 'success', label: '✅ Approuvé' };
        if (dgApproved || comptableApproved) return { status: 'PARTIEL', color: 'warning', label: '⏳ Validation partielle' };
        return { status: 'ATTENTE', color: 'info', label: '⏳ En attente' };
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ChatBubbleOutline color="primary" />
                    <Box>
                        <Typography variant="h6">
                            💬 Espace de concertation
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Le DG et le Comptable échangent ici pour valider conjointement les actions.
                            Les deux doivent approuver pour déverrouiller l'action.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Discussions
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {discussions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                Aucune discussion en cours
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {discussions.map((disc) => {
                                    const status = getValidationStatus(disc);
                                    return (
                                        <Paper
                                            key={disc.id}
                                            sx={{
                                                p: 1.5,
                                                cursor: 'pointer',
                                                bgcolor: selectedDiscussion?.id === disc.id ? 'primary.50' : 'transparent',
                                                border: selectedDiscussion?.id === disc.id ? 2 : 1,
                                                borderColor: selectedDiscussion?.id === disc.id ? 'primary.main' : 'divider'
                                            }}
                                            onClick={() => fetchDiscussion(disc.id)}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" fontWeight="medium" noWrap>
                                                    {disc.titre}
                                                </Typography>
                                                <Chip
                                                    label={status.label}
                                                    color={status.color}
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {disc.type_validation} • {formatDate(disc.date_creation)}
                                            </Typography>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    {selectedDiscussion ? (
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {selectedDiscussion.titre}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedDiscussion.type_validation} • Ouverte le {formatDate(selectedDiscussion.date_creation)}
                                    </Typography>
                                </Box>
                                <Box>
                                    {selectedDiscussion.est_active && isValidator && (
                                        <>
                                            <Tooltip title="Approuver">
                                                <IconButton
                                                    color="success"
                                                    onClick={() => handleValidation('APPROUVE')}
                                                    disabled={sending}
                                                >
                                                    <CheckCircle />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Rejeter">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleValidation('REJETE')}
                                                    disabled={sending}
                                                >
                                                    <Cancel />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </Box>
                            </Box>

                            <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Badge
                                                color={selectedDiscussion.validations?.some(v => v.role_validateur === 'DG' && v.decision === 'APPROUVE') ? 'success' : 'warning'}
                                                variant="dot"
                                            >
                                                <Person />
                                            </Badge>
                                            <Typography variant="body2">
                                                DG: {selectedDiscussion.validations?.some(v => v.role_validateur === 'DG' && v.decision === 'APPROUVE') ? '✅' : '⏳'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Badge
                                                color={selectedDiscussion.validations?.some(v => v.role_validateur === 'COMPTABLE' && v.decision === 'APPROUVE') ? 'success' : 'warning'}
                                                variant="dot"
                                            >
                                                <Person />
                                            </Badge>
                                            <Typography variant="body2">
                                                Comptable: {selectedDiscussion.validations?.some(v => v.role_validateur === 'COMPTABLE' && v.decision === 'APPROUVE') ? '✅' : '⏳'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Box sx={{ flex: 1, maxHeight: 400, overflow: 'auto', mb: 2 }}>
                                {selectedDiscussion.messages?.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                        Aucun message dans cette discussion
                                    </Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        {selectedDiscussion.messages?.map((msg) => (
                                            <MessageItem
                                                key={msg.id}
                                                message={msg}
                                                userRole={userRole}
                                                onReply={() => setReplyTo(msg)}
                                            />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </Stack>
                                )}
                            </Box>

                            {selectedDiscussion.est_active && isValidator && (
                                <Box>
                                    {replyTo && (
                                        <Paper sx={{ p: 1, mb: 1, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption">
                                                Réponse à: {replyTo.nom_validateur} {replyTo.prenom_validateur}
                                            </Typography>
                                            <IconButton size="small" onClick={() => setReplyTo(null)}>
                                                <Close fontSize="small" />
                                            </IconButton>
                                        </Paper>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Écrire un message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            disabled={sending}
                                            multiline
                                            rows={2}
                                        />
                                        <Button
                                            variant="contained"
                                            endIcon={sending ? <CircularProgress size={20} /> : <Send />}
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || sending}
                                            sx={{ alignSelf: 'flex-end' }}
                                        >
                                            Envoyer
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    ) : (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Sélectionnez une discussion pour voir les échanges
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

const MessageItem = ({ message, userRole, onReply }) => {
    const [showReplies, setShowReplies] = useState(false);

    return (
        <Paper sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}>
                        {message.prenom_validateur?.[0] || 'U'}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                            {message.nom_validateur} {message.prenom_validateur}
                            <Chip
                                label={message.role_validateur}
                                size="small"
                                sx={{ ml: 1, height: 18, fontSize: '0.6rem' }}
                            />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(message.date_creation)}
                            {message.est_modifie && ' (modifié)'}
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    {userRole && ['DG', 'COMPTABLE'].includes(userRole) && (
                        <Tooltip title="Répondre">
                            <IconButton size="small" onClick={onReply}>
                                <Reply fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {message.contenu}
            </Typography>
            {message.reponses && message.reponses.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    <Button
                        size="small"
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        {showReplies ? 'Cacher' : 'Afficher'} les {message.reponses.length} réponse(s)
                    </Button>
                    {showReplies && (
                        <Stack spacing={1} sx={{ ml: 3, mt: 1 }}>
                            {message.reponses.map((rep) => (
                                <MessageItem
                                    key={rep.id}
                                    message={rep}
                                    userRole={userRole}
                                    onReply={onReply}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default ConcertationsTab;