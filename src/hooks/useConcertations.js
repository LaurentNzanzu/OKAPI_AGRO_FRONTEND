// frontend/src/hooks/useConcertations.js
import { useState, useEffect, useCallback } from 'react';
import { concertationsService } from '../services/concertations';

export const useConcertations = (bienId, typeValidation = null) => {
    const [discussions, setDiscussions] = useState([]);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [eligibilite, setEligibilite] = useState({
        cession: { eligible: false, raison: '' },
        rebut: { eligible: false, raison: '' }
    });

    // Charger les discussions
    const loadDiscussions = useCallback(async () => {
        if (!bienId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await concertationsService.getByBien(bienId, typeValidation);
            setDiscussions(data || []);
            if (data?.length > 0 && !selectedDiscussion) {
                setSelectedDiscussion(data[0]);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur de chargement');
            console.error('Erreur chargement discussions:', err);
        } finally {
            setLoading(false);
        }
    }, [bienId, typeValidation, selectedDiscussion]);

    // Charger l'éligibilité
    const loadEligibilite = useCallback(async () => {
        if (!bienId) return;
        try {
            const cession = await concertationsService.verifierEligibilite(bienId, 'CESSION');
            const rebut = await concertationsService.verifierEligibilite(bienId, 'REBUT');
            setEligibilite({
                cession: {
                    eligible: cession.eligible || false,
                    validation_dg: cession.validation_dg || false,
                    validation_comptable: cession.validation_comptable || false,
                    raison: cession.raison || 'Validation double en attente'
                },
                rebut: {
                    eligible: rebut.eligible || false,
                    validation_dg: rebut.validation_dg || false,
                    validation_comptable: rebut.validation_comptable || false,
                    diagnostic_irrecuperable: rebut.diagnostic_irrecuperable || false,
                    raison: rebut.raison || 'Validation double en attente'
                }
            });
        } catch (err) {
            console.error('Erreur chargement éligibilité:', err);
        }
    }, [bienId]);

    // Sélectionner une discussion
    const selectDiscussion = useCallback(async (discussionId) => {
        try {
            setLoading(true);
            const data = await concertationsService.getById(discussionId);
            setSelectedDiscussion(data);
            // Mettre à jour la liste
            setDiscussions(prev => prev.map(d => d.id === discussionId ? data : d));
            return data;
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur de chargement');
            console.error('Erreur chargement discussion:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Ajouter un message
    const sendMessage = useCallback(async (discussionId, contenu, parentId = null) => {
        try {
            setLoading(true);
            const data = await concertationsService.ajouterMessage(discussionId, {
                contenu,
                parent_id: parentId
            });
            await selectDiscussion(discussionId);
            return data;
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur d\'envoi');
            console.error('Erreur envoi message:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [selectDiscussion]);

    // Valider une discussion
    const validerDiscussion = useCallback(async (discussionId, decision, commentaire = null) => {
        try {
            setLoading(true);
            const data = await concertationsService.valider(discussionId, {
                decision,
                commentaire: commentaire || `Validation ${decision} effectuée`
            });
            await selectDiscussion(discussionId);
            await loadEligibilite(); // Recharger l'éligibilité après validation
            return data;
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur de validation');
            console.error('Erreur validation:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [selectDiscussion, loadEligibilite]);

    // Créer une discussion
    const creerDiscussion = useCallback(async (data) => {
        try {
            setLoading(true);
            const result = await concertationsService.creer(data);
            await loadDiscussions();
            return result;
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur de création');
            console.error('Erreur création discussion:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadDiscussions]);

    // Clôturer une discussion
    const cloturerDiscussion = useCallback(async (discussionId) => {
        try {
            setLoading(true);
            const result = await concertationsService.cloturer(discussionId);
            await loadDiscussions();
            return result;
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur de clôture');
            console.error('Erreur clôture discussion:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadDiscussions]);

    // Recharger toutes les données
    const refresh = useCallback(async () => {
        await Promise.all([loadDiscussions(), loadEligibilite()]);
    }, [loadDiscussions, loadEligibilite]);

    // Chargement initial
    useEffect(() => {
        refresh();
    }, [bienId, refresh]);

    return {
        discussions,
        selectedDiscussion,
        loading,
        error,
        eligibilite,
        loadDiscussions,
        loadEligibilite,
        selectDiscussion,
        sendMessage,
        validerDiscussion,
        creerDiscussion,
        cloturerDiscussion,
        refresh
    };
};

export default useConcertations;