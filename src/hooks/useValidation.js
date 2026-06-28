// frontend/src/hooks/useValidation.js
import { useState, useEffect, useCallback } from 'react';
import { validationsService } from '../services/validations';
import { besoinsService } from '../services/besoins';
import { useAuth } from './useAuth';

/**
 * Hook pour gérer le workflow de validation
 * @param {Object} options - Options de configuration
 * @param {number} options.besoinId - ID du besoin à suivre
 * @param {boolean} options.autoLoad - Chargement automatique
 */
export const useValidation = (options = {}) => {
  const { 
    besoinId = null,
    autoLoad = true
  } = options;

  const { user } = useAuth();
  const [validations, setValidations] = useState([]);
  const [validationEnAttente, setValidationEnAttente] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userRole = user?.role?.nom?.toUpperCase() || '';
  const isValidator = ['DG', 'COMPTABLE', 'CAISSE', 'ADMIN'].includes(userRole);

  // Charger les validations en attente pour l'utilisateur
  const loadValidationsEnAttente = useCallback(async () => {
    if (!isValidator) return;
    
    try {
      const data = await validationsService.getEnAttente();
      setValidationEnAttente(data || []);
      return data;
    } catch (err) {
      console.error('Erreur chargement validations en attente:', err);
      throw err;
    }
  }, [isValidator]);

  // Charger le workflow d'un besoin
  const loadWorkflow = useCallback(async (id) => {
    const targetId = id || besoinId;
    if (!targetId) return null;

    try {
      const data = await validationsService.getWorkflow(targetId);
      setWorkflow(data);
      return data;
    } catch (err) {
      console.error('Erreur chargement workflow:', err);
      throw err;
    }
  }, [besoinId]);

  // Charger l'historique des validations d'un besoin
  const loadHistorique = useCallback(async (id) => {
    const targetId = id || besoinId;
    if (!targetId) return [];

    try {
      const data = await validationsService.getHistorique(targetId);
      setHistorique(data || []);
      return data;
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      throw err;
    }
  }, [besoinId]);

  // Approuver une validation
  const approuver = useCallback(async (validationId, commentaire = null, pieceJustificative = null) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await validationsService.approuver(validationId, {
        commentaire,
        piece_justificative_url: pieceJustificative
      });
      
      // Recharger les données
      await Promise.all([
        loadValidationsEnAttente(),
        besoinId ? loadWorkflow() : Promise.resolve()
      ]);
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de l\'approbation';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [besoinId, loadValidationsEnAttente, loadWorkflow]);

  // Rejeter une validation (motif obligatoire)
  const rejeter = useCallback(async (validationId, motifRejet, commentaire = null, pieceJustificative = null) => {
    if (!motifRejet || !motifRejet.trim()) {
      const errorMsg = 'Le motif de rejet est obligatoire';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await validationsService.rejeter(validationId, {
        motif_rejet: motifRejet,
        commentaire,
        piece_justificative_url: pieceJustificative
      });
      
      // Recharger les données
      await Promise.all([
        loadValidationsEnAttente(),
        besoinId ? loadWorkflow() : Promise.resolve()
      ]);
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du rejet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [besoinId, loadValidationsEnAttente, loadWorkflow]);

  // Obtenir le prochain validateur
  const getProchainValidateur = useCallback(() => {
    if (!workflow) return null;
    
    const ordres = ['DG', 'COMPTABLE', 'CAISSE'];
    const statutActuel = workflow.statut_actuel;
    
    if (statutActuel === 'EN_ATTENTE_COMPTABLE') return 'COMPTABLE';
    if (statutActuel === 'COMPTABLE_VALIDE') return 'CAISSE';
    if (statutActuel === 'CAISSE_VALIDE') return 'DG';
    if (statutActuel === 'APPROUVEE') return null;
    if (statutActuel === 'REJETE') return null;
    
    return 'COMPTABLE';
  }, [workflow]);

  // Vérifier si l'utilisateur peut valider
  const peutValider = useCallback(() => {
    if (!isValidator || !workflow) return false;
    
    const prochain = getProchainValidateur();
    return prochain === userRole;
  }, [isValidator, workflow, getProchainValidateur, userRole]);

  // Recharger toutes les données
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadValidationsEnAttente(),
        besoinId ? loadWorkflow() : Promise.resolve(),
        besoinId ? loadHistorique() : Promise.resolve()
      ]);
    } catch (err) {
      console.error('Erreur refresh:', err);
    } finally {
      setLoading(false);
    }
  }, [besoinId, loadValidationsEnAttente, loadWorkflow, loadHistorique]);

  // Chargement initial
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  return {
    validations: validationEnAttente,
    workflow,
    historique,
    loading,
    error,
    submitting,
    isValidator,
    userRole,
    peutValider,
    prochainValidateur: getProchainValidateur(),
    loadValidationsEnAttente,
    loadWorkflow,
    loadHistorique,
    approuver,
    rejeter,
    refresh,
    // Alias pour compatibilité
    getEnAttente: loadValidationsEnAttente,
    getWorkflow: loadWorkflow,
    getHistorique: loadHistorique,
    approve: approuver,
    reject: rejeter,
  };
};

export default useValidation;