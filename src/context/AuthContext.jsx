// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth';
import { userHasPermission, hasRole as permHasRole, hasAnyRole as permHasAnyRole } from '../config/permissions';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Vérification de l'état initial
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Vérifier si un token existe en sessionStorage
        const token = authService.getAccessToken();
        const sessionUuid = authService.getSessionUuid();
        
        if (token && !authService.isTokenExpired()) {
          // Récupérer les informations de l'utilisateur
          const result = await authService.getCurrentUser();
          if (result.success) {
            setUser(result.data);
            setIsAuthenticated(true);
            setAuthReady(true);
          } else {
            // Token invalide, nettoyer
            authService.clearTokens();
            setIsAuthenticated(false);
            setAuthReady(true);
          }
        } else if (token && authService.isTokenExpired()) {
          // Token expiré, tenter de restaurer la session
          const restoreResult = await authService.restoreSession();
          if (restoreResult.success) {
            const userResult = await authService.getCurrentUser();
            if (userResult.success) {
              setUser(userResult.data);
              setIsAuthenticated(true);
              setAuthReady(true);
            }
          } else {
            authService.clearTokens();
            setIsAuthenticated(false);
            setAuthReady(true);
          }
        } else {
          // Pas de token en sessionStorage
          // Vérifier si on a un cookie Refresh Token (via /me)
          try {
            const userResult = await authService.getCurrentUser();
            if (userResult.success) {
              setUser(userResult.data);
              setIsAuthenticated(true);
              setAuthReady(true);
            } else {
              setIsAuthenticated(false);
              setAuthReady(true);
            }
          } catch {
            setIsAuthenticated(false);
            setAuthReady(true);
          }
        }
      } catch (error) {
        console.error('Erreur d\'initialisation de l\'authentification:', error);
        authService.clearTokens();
        setIsAuthenticated(false);
        setAuthReady(true);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // === LOGIN ===
  const login = useCallback(async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, data: result.data };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de connexion',
      };
    }
  }, []);

  // === LOGOUT ===
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      authService.clearTokens();
    }
  }, []);

  // === REFRESH ===
  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      if (result.success) {
        // Réactualiser les informations utilisateur
        const userResult = await authService.getCurrentUser();
        if (userResult.success) {
          setUser(userResult.data);
          setIsAuthenticated(true);
        }
        return { success: true };
      }
      // Si le refresh échoue, déconnecter
      await logout();
      return { success: false, error: result.error };
    } catch (error) {
      await logout();
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de rafraîchissement',
      };
    }
  }, [logout]);

  // === MISE À JOUR DU PROFIL ===
  const updateUser = useCallback((userData) => {
    setUser(userData);
    authService.setUser(userData);
  }, []);

  // === PERMISSIONS HELPERS ===
  const hasPermission = useCallback((permission) => {
    return userHasPermission(user, permission);
  }, [user]);

  const hasRole = useCallback((role) => {
    return permHasRole(user, role);
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return permHasAnyRole(user, roles);
  }, [user]);

  const value = {
    user,
    loading,
    authReady,
    isAuthenticated,
    authenticated: isAuthenticated,
    login,
    logout,
    refreshToken,
    updateUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    // Exposer certaines méthodes du service
    getAccessToken: authService.getAccessToken,
    getSessionUuid: authService.getSessionUuid,
    isTokenExpired: authService.isTokenExpired,
    getFingerprint: authService.getFingerprint,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;