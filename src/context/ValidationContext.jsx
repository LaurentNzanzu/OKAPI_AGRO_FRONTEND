// frontend/src/context/ValidationContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { validationsService } from '../services/validations';
import { useAuth } from '../hooks/useAuth';

// Types d'actions
const VALIDATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_VALIDATIONS: 'SET_VALIDATIONS',
  SET_WORKFLOW: 'SET_WORKFLOW',
  SET_HISTORIQUE: 'SET_HISTORIQUE',
  ADD_VALIDATION: 'ADD_VALIDATION',
  UPDATE_VALIDATION: 'UPDATE_VALIDATION',
  CLEAR_STATE: 'CLEAR_STATE',
  SET_SUBMITTING: 'SET_SUBMITTING',
};

// État initial
const initialState = {
  validations: [],
  workflow: null,
  historique: [],
  loading: false,
  submitting: false,
  error: null,
};

// Reducer
const validationReducer = (state, action) => {
  switch (action.type) {
    case VALIDATION_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case VALIDATION_ACTIONS.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    case VALIDATION_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case VALIDATION_ACTIONS.SET_VALIDATIONS:
      return { ...state, validations: action.payload };
    case VALIDATION_ACTIONS.SET_WORKFLOW:
      return { ...state, workflow: action.payload };
    case VALIDATION_ACTIONS.SET_HISTORIQUE:
      return { ...state, historique: action.payload };
    case VALIDATION_ACTIONS.ADD_VALIDATION:
      return { ...state, validations: [action.payload, ...state.validations] };
    case VALIDATION_ACTIONS.UPDATE_VALIDATION:
      return {
        ...state,
        validations: state.validations.map(v =>
          v.id === action.payload.id ? action.payload : v
        )
      };
    case VALIDATION_ACTIONS.CLEAR_STATE:
      return initialState;
    default:
      return state;
  }
};

// Création du contexte
const ValidationContext = createContext(null);

// Provider
export const ValidationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(validationReducer, initialState);
  const { user } = useAuth();

  const userRole = user?.role?.nom?.toUpperCase() || '';
  const isValidator = ['DG', 'COMPTABLE', 'CAISSE', 'ADMIN'].includes(userRole);

  // Charger les validations en attente
  const loadValidationsEnAttente = useCallback(async () => {
    if (!isValidator) return;

    dispatch({ type: VALIDATION_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: null });

    try {
      const data = await validationsService.getEnAttente();
      dispatch({ type: VALIDATION_ACTIONS.SET_VALIDATIONS, payload: data || [] });
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du chargement des validations';
      dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: VALIDATION_ACTIONS.SET_LOADING, payload: false });
    }
  }, [isValidator]);

  // Charger le workflow d'un besoin
  const loadWorkflow = useCallback(async (besoinId) => {
    if (!besoinId) return null;

    dispatch({ type: VALIDATION_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: null });

    try {
      const data = await validationsService.getWorkflow(besoinId);
      dispatch({ type: VALIDATION_ACTIONS.SET_WORKFLOW, payload: data });
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du chargement du workflow';
      dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: VALIDATION_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Charger l'historique d'un besoin
  const loadHistorique = useCallback(async (besoinId) => {
    if (!besoinId) return [];

    try {
      const data = await validationsService.getHistorique(besoinId);
      dispatch({ type: VALIDATION_ACTIONS.SET_HISTORIQUE, payload: data || [] });
      return data;
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      return [];
    }
  }, []);

  // Approuver une validation
  const approuver = useCallback(async (validationId, commentaire = null) => {
    dispatch({ type: VALIDATION_ACTIONS.SET_SUBMITTING, payload: true });
    dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await validationsService.approuver(validationId, { commentaire });
      
      // Mettre à jour la liste des validations
      await loadValidationsEnAttente();
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de l\'approbation';
      dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: VALIDATION_ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [loadValidationsEnAttente]);

  // Rejeter une validation
  const rejeter = useCallback(async (validationId, motifRejet, commentaire = null) => {
    if (!motifRejet || !motifRejet.trim()) {
      const errorMsg = 'Le motif de rejet est obligatoire';
      dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: errorMsg });
      throw new Error(errorMsg);
    }

    dispatch({ type: VALIDATION_ACTIONS.SET_SUBMITTING, payload: true });
    dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await validationsService.rejeter(validationId, {
        motif_rejet: motifRejet,
        commentaire
      });
      
      // Mettre à jour la liste des validations
      await loadValidationsEnAttente();
      
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du rejet';
      dispatch({ type: VALIDATION_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: VALIDATION_ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [loadValidationsEnAttente]);

  // Effacer l'état
  const clearState = useCallback(() => {
    dispatch({ type: VALIDATION_ACTIONS.CLEAR_STATE });
  }, []);

  // Recharger toutes les données
  const refresh = useCallback(async (besoinId = null) => {
    await loadValidationsEnAttente();
    if (besoinId) {
      await loadWorkflow(besoinId);
      await loadHistorique(besoinId);
    }
  }, [loadValidationsEnAttente, loadWorkflow, loadHistorique]);

  // Chargement initial
  useEffect(() => {
    if (isValidator) {
      loadValidationsEnAttente();
    }
  }, [isValidator, loadValidationsEnAttente]);

  const contextValue = {
    ...state,
    isValidator,
    userRole,
    loadValidationsEnAttente,
    loadWorkflow,
    loadHistorique,
    approuver,
    rejeter,
    clearState,
    refresh,
    // Alias
    getEnAttente: loadValidationsEnAttente,
    getWorkflow: loadWorkflow,
    getHistorique: loadHistorique,
    approve: approuver,
    reject: rejeter,
  };

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useValidationContext = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidationContext must be used within ValidationProvider');
  }
  return context;
};

export default ValidationContext;