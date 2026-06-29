// frontend/src/hooks/useCession.js
import { useState, useCallback } from 'react';
import { biensService } from '../services/biens';
import { cessionsService } from '../services/cessions';
import { useAuth } from './useAuth';

/**
 * Hook pour gérer les cessions
 * @param {Object} options - Options de configuration
 * @param {number} options.bienId - ID du bien concerné
 * @param {boolean} options.autoLoad - Chargement automatique
 */
export const useCession = (options = {}) => {
  const { 
    bienId = null,
    autoLoad = true
  } = options;

  const { user } = useAuth();
  const [eligibilite, setEligibilite] = useState(null);
  const [cessionEnCours, setCessionEnCours] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userRole = user?.role?.nom?.toUpperCase() || '';
  const peutDemanderCession = ['ADMIN', 'DG', 'COMPTABLE'].includes(userRole);
  const peutValiderCession = ['ADMIN', 'DG', 'COMPTABLE', 'CAISSE'].includes(userRole);

  // Vérifier l'éligibilité d'un bien à la cession (4 règles)
  const verifierEligibilite = useCallback(async (id) => {
    const targetId = id || bienId;
    if (!targetId) {
      setError('ID du bien requis');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await biensService.verifierEligibiliteCession(targetId);
      setEligibilite(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la vérification d\'éligibilité';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [bienId]);

  // Obtenir la liste des biens éligibles
  const getBiensEligibles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await biensService.getBiensEligiblesCession();
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du chargement des biens éligibles';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Demander une cession
  const demanderCession = useCallback(async (data) => {
    const targetId = data.id_bien || bienId;
    if (!targetId) {
      const errorMsg = 'ID du bien requis';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Vérifier l'éligibilité avant de continuer
    try {
      const elig = await verifierEligibilite(targetId);
      if (!elig || !elig.est_eligible) {
        const motifs = elig?.motifs_ineligibilite?.join(', ') || 'Non éligible';
        throw new Error(`Ce bien n'est pas éligible à la cession: ${motifs}`);
      }
    } catch (err) {
      throw err;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await biensService.demanderCession(targetId, data);
      setCessionEnCours(result);
      
      // Charger le workflow
      if (result.id_cession) {
        await getWorkflowCession(targetId);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la demande de cession';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [bienId, verifierEligibilite]);

  // Obtenir le workflow de cession
  const getWorkflowCession = useCallback(async (id) => {
    const targetId = id || bienId;
    if (!targetId) return null;

    setLoading(true);
    try {
      const data = await biensService.getCessionWorkflow(targetId);
      setWorkflow(data);
      return data;
    } catch (err) {
      console.error('Erreur chargement workflow cession:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bienId]);

  // Valider une cession (approuver ou rejeter)
  const validerCession = useCallback(async (cessionId, decision, commentaire = null) => {
    if (!decision || !['APPROUVE', 'REJETE'].includes(decision)) {
      const errorMsg = 'Décision invalide. Utilisez APPROUVE ou REJETE';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setSubmitting(true);
    setError(null);
    try {
      // Appeler le service de validation
      const result = await cessionsService.valider(cessionId, {
        decision,
        commentaire
      });
      
      // Recharger le workflow
      if (bienId) {
        await getWorkflowCession(bienId);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la validation de la cession';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [bienId, getWorkflowCession]);

  // Lier un actif de remplacement
  const lierActifRemplacement = useCallback(async (bienCedeId, bienRemplacementId) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await biensService.lierActifRemplacement(bienCedeId, bienRemplacementId);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du lien avec l\'actif de remplacement';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Récupérer l'historique des cessions d'un bien
  const getHistoriqueCessions = useCallback(async (id) => {
    const targetId = id || bienId;
    if (!targetId) return [];

    try {
      const data = await cessionsService.getHistoriqueParBien(targetId);
      setHistorique(data || []);
      return data;
    } catch (err) {
      console.error('Erreur chargement historique cessions:', err);
      return [];
    }
  }, [bienId]);

  // Chargement initial
  const refresh = useCallback(async () => {
    if (!bienId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        verifierEligibilite(bienId),
        getWorkflowCession(bienId),
        getHistoriqueCessions(bienId)
      ]);
    } catch (err) {
      console.error('Erreur refresh cession:', err);
    } finally {
      setLoading(false);
    }
  }, [bienId, verifierEligibilite, getWorkflowCession, getHistoriqueCessions]);

  // Chargement automatique
  useState(() => {
    if (autoLoad && bienId) {
      refresh();
    }
  }, [autoLoad, bienId, refresh]);

  return {
    eligibilite,
    cessionEnCours,
    workflow,
    historique,
    loading,
    error,
    submitting,
    peutDemanderCession,
    peutValiderCession,
    verifierEligibilite,
    getBiensEligibles,
    demanderCession,
    getWorkflowCession,
    validerCession,
    lierActifRemplacement,
    getHistoriqueCessions,
    refresh,
    // Alias
    checkEligibility: verifierEligibilite,
    getEligibleAssets: getBiensEligibles,
    requestCession: demanderCession,
    getCessionWorkflow: getWorkflowCession,
    validateCession: validerCession,
    linkReplacementAsset: lierActifRemplacement,
    getCessionHistory: getHistoriqueCessions,
  };
};

export default useCession;