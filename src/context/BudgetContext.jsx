// frontend/src/context/BudgetContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { budgetsService } from '../services/budgets';
import { useAuth } from '../hooks/useAuth';

// Types d'actions
const BUDGET_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BUDGETS: 'SET_BUDGETS',
  SET_SYNTHESE: 'SET_SYNTHESE',
  SET_EXERCICE: 'SET_EXERCICE',
  SET_CENTRE_COUT: 'SET_CENTRE_COUT',
  ADD_BUDGET: 'ADD_BUDGET',
  UPDATE_BUDGET: 'UPDATE_BUDGET',
  REMOVE_BUDGET: 'REMOVE_BUDGET',
  CLEAR_STATE: 'CLEAR_STATE',
  SET_SUBMITTING: 'SET_SUBMITTING',
};

// État initial
const initialState = {
  budgets: [],
  synthese: null,
  exercice: new Date().getFullYear(),
  centreCout: null,
  loading: false,
  submitting: false,
  error: null,
};

// Reducer
const budgetReducer = (state, action) => {
  switch (action.type) {
    case BUDGET_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case BUDGET_ACTIONS.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    case BUDGET_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case BUDGET_ACTIONS.SET_BUDGETS:
      return { ...state, budgets: action.payload };
    case BUDGET_ACTIONS.SET_SYNTHESE:
      return { ...state, synthese: action.payload };
    case BUDGET_ACTIONS.SET_EXERCICE:
      return { ...state, exercice: action.payload };
    case BUDGET_ACTIONS.SET_CENTRE_COUT:
      return { ...state, centreCout: action.payload };
    case BUDGET_ACTIONS.ADD_BUDGET:
      return { ...state, budgets: [action.payload, ...state.budgets] };
    case BUDGET_ACTIONS.UPDATE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.map(b =>
          b.id_budget === action.payload.id_budget ? action.payload : b
        )
      };
    case BUDGET_ACTIONS.REMOVE_BUDGET:
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id_budget !== action.payload)
      };
    case BUDGET_ACTIONS.CLEAR_STATE:
      return initialState;
    default:
      return state;
  }
};

// Création du contexte
const BudgetContext = createContext(null);

// Provider
export const BudgetProvider = ({ children, initialExercice = null }) => {
  const [state, dispatch] = useReducer(budgetReducer, {
    ...initialState,
    exercice: initialExercice || new Date().getFullYear()
  });
  const { user } = useAuth();

  const userRole = user?.role?.nom?.toUpperCase() || '';
  const peutGererBudgets = ['ADMIN', 'DG', 'COMPTABLE'].includes(userRole);

  // Charger les budgets
  const loadBudgets = useCallback(async (exercice = null, centreCout = null) => {
    const exerciceAnnee = exercice || state.exercice;
    const centre = centreCout || state.centreCout;

    dispatch({ type: BUDGET_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: null });

    try {
      const [listData, syntheseData] = await Promise.all([
        budgetsService.getAll({ 
          exercice: exerciceAnnee,
          centre_cout: centre || undefined
        }),
        budgetsService.getSynthese(exerciceAnnee).catch(() => null)
      ]);

      dispatch({ type: BUDGET_ACTIONS.SET_BUDGETS, payload: listData || [] });
      dispatch({ type: BUDGET_ACTIONS.SET_SYNTHESE, payload: syntheseData });
      
      return { budgets: listData || [], synthese: syntheseData };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors du chargement des budgets';
      dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: BUDGET_ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.exercice, state.centreCout]);

  // Vérifier la disponibilité d'un budget
  const verifierDisponibilite = useCallback(async (centreCout, exerciceAnnee, montant) => {
    try {
      const result = await budgetsService.verifierDisponibilite(
        centreCout,
        exerciceAnnee || state.exercice,
        montant
      );
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la vérification';
      dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    }
  }, [state.exercice]);

  // Créer un budget
  const creerBudget = useCallback(async (data) => {
    dispatch({ type: BUDGET_ACTIONS.SET_SUBMITTING, payload: true });
    dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await budgetsService.create(data);
      dispatch({ type: BUDGET_ACTIONS.ADD_BUDGET, payload: result });
      await loadBudgets();
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la création du budget';
      dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: BUDGET_ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [loadBudgets]);

  // Mettre à jour un budget
  const mettreAJourBudget = useCallback(async (id, data) => {
    dispatch({ type: BUDGET_ACTIONS.SET_SUBMITTING, payload: true });
    dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: null });

    try {
      const result = await budgetsService.update(id, data);
      dispatch({ type: BUDGET_ACTIONS.UPDATE_BUDGET, payload: result });
      await loadBudgets();
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la mise à jour du budget';
      dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: BUDGET_ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [loadBudgets]);

  // Supprimer un budget
  const supprimerBudget = useCallback(async (id) => {
    dispatch({ type: BUDGET_ACTIONS.SET_SUBMITTING, payload: true });
    dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: null });

    try {
      await budgetsService.delete(id);
      dispatch({ type: BUDGET_ACTIONS.REMOVE_BUDGET, payload: id });
      await loadBudgets();
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la suppression du budget';
      dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    } finally {
      dispatch({ type: BUDGET_ACTIONS.SET_SUBMITTING, payload: false });
    }
  }, [loadBudgets]);

  // Vérifier la trésorerie
  const verifierTresorerie = useCallback(async (montant) => {
    try {
      const result = await budgetsService.verifierTresorerie(montant);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erreur lors de la vérification de trésorerie';
      dispatch({ type: BUDGET_ACTIONS.SET_ERROR, payload: errorMsg });
      throw err;
    }
  }, []);

  // Changer l'exercice
  const changerExercice = useCallback((exercice) => {
    dispatch({ type: BUDGET_ACTIONS.SET_EXERCICE, payload: exercice });
  }, []);

  // Changer le centre de coût
  const changerCentreCout = useCallback((centreCout) => {
    dispatch({ type: BUDGET_ACTIONS.SET_CENTRE_COUT, payload: centreCout });
  }, []);

  // Effacer l'état
  const clearState = useCallback(() => {
    dispatch({ type: BUDGET_ACTIONS.CLEAR_STATE });
  }, []);

  // Recharger les données
  const refresh = useCallback(async () => {
    await loadBudgets();
  }, [loadBudgets]);

  // Chargement initial
  useEffect(() => {
    if (peutGererBudgets) {
      loadBudgets();
    }
  }, [peutGererBudgets, loadBudgets]);

  const contextValue = {
    ...state,
    peutGererBudgets,
    userRole,
    loadBudgets,
    verifierDisponibilite,
    creerBudget,
    mettreAJourBudget,
    supprimerBudget,
    verifierTresorerie,
    changerExercice,
    changerCentreCout,
    clearState,
    refresh,
    // Alias
    getBudgets: loadBudgets,
    checkAvailability: verifierDisponibilite,
    createBudget: creerBudget,
    updateBudget: mettreAJourBudget,
    deleteBudget: supprimerBudget,
    checkCash: verifierTresorerie,
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useBudgetContext = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgetContext must be used within BudgetProvider');
  }
  return context;
};

export default BudgetContext;