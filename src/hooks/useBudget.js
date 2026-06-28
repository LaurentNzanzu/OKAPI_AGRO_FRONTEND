// frontend/src/hooks/useBudget.js
import { useState, useEffect, useCallback } from 'react';
import { budgetsService } from '../services/budgets';
import { useAuth } from './useAuth';

/**
 * Hook pour gérer les données budgétaires
 * @param {Object} options - Options de configuration
 * @param {number} options.exercice - Exercice comptable (défaut: année en cours)
 * @param {string} options.centre_cout - Centre de coût spécifique
 * @param {boolean} options.autoLoad - Chargement automatique des données
 */
export const useBudget = (options = {}) => {
  const { 
    exercice = new Date().getFullYear(),
    centre_cout = null,
    autoLoad = true
  } = options;

  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [synthese, setSynthese] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExercice, setSelectedExercice] = useState(exercice);
  const [selectedCentreCout, setSelectedCentreCout] = useState(centre_cout);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listData, syntheseData] = await Promise.all([
        budgetsService.getAll({ 
          exercice: selectedExercice,
          centre_cout: selectedCentreCout || undefined
        }),
        budgetsService.getSynthese(selectedExercice).catch(() => null)
      ]);
      
      setBudgets(listData || []);
      setSynthese(syntheseData);
    } catch (err) {
      console.error('Erreur chargement budgets:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedExercice, selectedCentreCout]);

  // Vérifier la disponibilité d'un budget
  const verifierDisponibilite = useCallback(async (centreCout, exerciceAnnee, montant) => {
    try {
      const result = await budgetsService.verifierDisponibilite(
        centreCout,
        exerciceAnnee || selectedExercice,
        montant
      );
      return result;
    } catch (err) {
      console.error('Erreur vérification disponibilité:', err);
      throw err;
    }
  }, [selectedExercice]);

  // Engager un montant sur un budget
  const engagerMontant = useCallback(async (centreCout, exerciceAnnee, montant) => {
    try {
      // Vérifier d'abord la disponibilité
      const verification = await verifierDisponibilite(centreCout, exerciceAnnee, montant);
      if (!verification.est_disponible) {
        throw new Error(verification.message || 'Budget insuffisant');
      }
      
      // Dans un vrai scenario, on appellerait l'API d'engagement
      // Pour l'instant, on recharge les données
      await loadBudgets();
      return { success: true, message: 'Montant engagé avec succès' };
    } catch (err) {
      console.error('Erreur engagement:', err);
      throw err;
    }
  }, [verifierDisponibilite, loadBudgets]);

  // Créer un nouveau budget
  const creerBudget = useCallback(async (data) => {
    try {
      const result = await budgetsService.create(data);
      await loadBudgets();
      return result;
    } catch (err) {
      console.error('Erreur création budget:', err);
      throw err;
    }
  }, [loadBudgets]);

  // Mettre à jour un budget
  const mettreAJourBudget = useCallback(async (id, data) => {
    try {
      const result = await budgetsService.update(id, data);
      await loadBudgets();
      return result;
    } catch (err) {
      console.error('Erreur mise à jour budget:', err);
      throw err;
    }
  }, [loadBudgets]);

  // Supprimer un budget
  const supprimerBudget = useCallback(async (id) => {
    try {
      await budgetsService.delete(id);
      await loadBudgets();
      return { success: true };
    } catch (err) {
      console.error('Erreur suppression budget:', err);
      throw err;
    }
  }, [loadBudgets]);

  // Vérifier la trésorerie
  const verifierTresorerie = useCallback(async (montant) => {
    try {
      const result = await budgetsService.verifierTresorerie(montant);
      return result;
    } catch (err) {
      console.error('Erreur vérification trésorerie:', err);
      throw err;
    }
  }, []);

  // Obtenir la consommation d'un centre de coût
  const getConsommation = useCallback(async (centreCout, exerciceAnnee) => {
    try {
      const result = await budgetsService.getConsommation(
        centreCout,
        exerciceAnnee || selectedExercice
      );
      return result;
    } catch (err) {
      console.error('Erreur récupération consommation:', err);
      throw err;
    }
  }, [selectedExercice]);

  // Changer l'exercice
  const changerExercice = useCallback((nouvelExercice) => {
    setSelectedExercice(nouvelExercice);
  }, []);

  // Changer le centre de coût
  const changerCentreCout = useCallback((nouveauCentre) => {
    setSelectedCentreCout(nouveauCentre);
  }, []);

  useEffect(() => {
    if (autoLoad && user) {
      loadBudgets();
    }
  }, [autoLoad, user, loadBudgets]);

  return {
    budgets,
    synthese,
    loading,
    error,
    selectedExercice,
    selectedCentreCout,
    loadBudgets,
    verifierDisponibilite,
    engagerMontant,
    creerBudget,
    mettreAJourBudget,
    supprimerBudget,
    verifierTresorerie,
    getConsommation,
    changerExercice,
    changerCentreCout,
    // Alias pour compatibilité
    refresh: loadBudgets,
    createBudget: creerBudget,
    updateBudget: mettreAJourBudget,
    deleteBudget: supprimerBudget,
  };
};

export default useBudget;